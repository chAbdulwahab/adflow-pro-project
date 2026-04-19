import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { paymentVerifySchema } from '@/lib/validators';
import { transitionAdStatus } from '@/lib/status-machine';
import { calculateRankScore } from '@/lib/rank';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// POST /api/admin/payments/[id]/verify — Step 15: Verify or reject a payment
//
// verify → payment_submitted → payment_verified → published  (immediate publish)
// reject → payment_submitted → payment_pending (client can resubmit)
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRole(req, 'admin', 'super_admin');
    const { id: paymentId } = await params;

    // 1. Validate body
    const body = await req.json();
    const parsed = paymentVerifySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { action, rejection_note } = parsed.data;

    if (action === 'reject' && !rejection_note) {
      return errorResponse('rejection_note is required when rejecting a payment', 400);
    }

    // 2. Fetch the payment + its associated ad (with package info for publishing)
    const paymentResult = await db.query(
      `SELECT
         p.*,
         a.status      AS ad_status,
         a.user_id     AS ad_owner_id,
         a.package_id,
         a.is_featured AS ad_is_featured,
         pkg.duration_days,
         pkg.is_featured AS pkg_is_featured,
         pkg.weight      AS pkg_weight,
         sp.is_verified  AS seller_verified
       FROM payments p
       JOIN ads a            ON p.ad_id    = a.id
       LEFT JOIN packages pkg   ON a.package_id  = pkg.id
       LEFT JOIN seller_profiles sp ON sp.user_id = a.user_id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) return errorResponse('Payment not found', 404);

    const payment = paymentResult.rows[0];

    if (payment.status !== 'pending') {
      return errorResponse(
        `Payment is already '${payment.status}'. Only pending payments can be reviewed.`,
        422
      );
    }

    if (payment.ad_status !== 'payment_submitted') {
      return errorResponse(
        `Ad is in '${payment.ad_status}' status. Expected 'payment_submitted'.`,
        422
      );
    }

    const ip = req.headers.get('x-forwarded-for') ?? undefined;

    // ── VERIFY ──────────────────────────────────────────────────────────────
    if (action === 'verify') {
      // 3a. Mark payment as verified
      await db.query(
        `UPDATE payments
         SET status = 'verified', verified_by = $1, verified_at = NOW()
         WHERE id = $2`,
        [actor.id, paymentId]
      );

      // 3b. Transition: payment_submitted → payment_verified
      await transitionAdStatus({
        adId: payment.ad_id,
        newStatus: 'payment_verified',
        actorId: actor.id,
        note: `Payment verified — ref: ${payment.transaction_ref}`,
        ipAddress: ip,
      });

      // 3c. Calculate publish/expire dates from package duration
      const durationDays: number = payment.duration_days ?? 30;
      const publishAt  = new Date();
      const expireAt   = new Date(publishAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const isFeatured: boolean = payment.pkg_is_featured ?? false;

      const rankScore = calculateRankScore({
        is_featured:        isFeatured,
        package_weight:     payment.pkg_weight ?? 1,
        publish_at:         publishAt,
        admin_boost:        0,
        seller_is_verified: payment.seller_verified ?? false,
      });

      // 3d. Set publish/expire dates + featured flag + rank_score on the ad
      await db.query(
        `UPDATE ads
         SET publish_at  = $1,
             expire_at   = $2,
             is_featured  = $3,
             rank_score   = $4,
             updated_at   = NOW()
         WHERE id = $5`,
        [publishAt, expireAt, isFeatured, rankScore, payment.ad_id]
      );

      // 3e. Transition: payment_verified → published
      await transitionAdStatus({
        adId: payment.ad_id,
        newStatus: 'published',
        actorId: actor.id,
        note: 'Ad published immediately after payment verification',
        ipAddress: ip,
      });

      // 3f. Notify owner — ad is now LIVE
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'ad_published', $4)`,
        [
          payment.ad_owner_id,
          '🎉 Your ad is now live!',
          `Your payment was verified and your ad is now publicly visible. It will stay live for ${durationDays} days.`,
          `/ads/${payment.ad_id}`,
        ]
      );

      return successResponse({
        message: 'Payment verified. Ad is now published and publicly visible.',
        paymentId,
        adId: payment.ad_id,
        publish_at:  publishAt,
        expire_at:   expireAt,
        is_featured: isFeatured,
        rank_score:  rankScore,
      });
    }

    // ── REJECT ──────────────────────────────────────────────────────────────
    await db.query(
      `UPDATE payments
       SET status = 'rejected', rejection_note = $1, verified_by = $2, verified_at = NOW()
       WHERE id = $3`,
      [rejection_note, actor.id, paymentId]
    );

    // Roll back ad to payment_pending so client can resubmit
    await transitionAdStatus({
      adId: payment.ad_id,
      newStatus: 'payment_pending',
      actorId: actor.id,
      note: `Payment rejected — ${rejection_note}`,
      ipAddress: ip,
    });

    // Notify owner
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'payment_rejected', $4)`,
      [
        payment.ad_owner_id,
        'Payment rejected',
        `Your payment was rejected. Reason: ${rejection_note}. Please submit a new payment.`,
        `/ads/${payment.ad_id}/payment`,
      ]
    );

    return successResponse({
      message: 'Payment rejected. Ad returned to payment_pending.',
      paymentId,
      adId: payment.ad_id,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}
