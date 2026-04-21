import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    // 2. Fetch the payment + its associated ad using Supabase
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        ads!inner (
          id, status, user_id, package_id, is_featured,
          packages ( duration_days, is_featured, weight ),
          seller_profiles!user_id ( is_verified )
        )
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) return errorResponse('Payment not found', 404);

    const ad = Array.isArray(payment.ads) ? payment.ads[0] : payment.ads;
    const adStatus = ad?.status;
    const adOwnerId = ad?.user_id;
    const adPackage = Array.isArray(ad?.packages) ? ad.packages[0] : ad?.packages;
    const adIsFeatured = ad?.is_featured;
    const sellerProf = Array.isArray(ad?.seller_profiles) ? ad.seller_profiles[0] : ad?.seller_profiles;
    const sellerVerified = sellerProf?.is_verified;

    if (payment.status !== 'pending') {
      return errorResponse(
        `Payment is already '${payment.status}'. Only pending payments can be reviewed.`,
        422
      );
    }

    if (adStatus !== 'payment_submitted') {
      return errorResponse(
        `Ad is in '${adStatus}' status. Expected 'payment_submitted'.`,
        422
      );
    }

    const ip = req.headers.get('x-forwarded-for') ?? undefined;

    // ── VERIFY ──────────────────────────────────────────────────────────────
    if (action === 'verify') {
      // 3a. Mark payment as verified
      const { error: pUpdateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'verified',
          verified_by: actor.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (pUpdateError) throw pUpdateError;

      // 3b. Transition: payment_submitted → payment_verified
      await transitionAdStatus({
        adId: payment.ad_id,
        newStatus: 'payment_verified',
        actorId: actor.id,
        note: `Payment verified — ref: ${payment.transaction_ref}`,
        ipAddress: ip,
      });

      // 3c. Calculate publish/expire dates
      const durationDays: number = adPackage?.duration_days ?? 30;
      const publishAt  = new Date();
      const expireAt   = new Date(publishAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const isFeatured: boolean = adPackage?.is_featured ?? false;

      const rankScore = calculateRankScore({
        is_featured:        isFeatured,
        package_weight:     adPackage?.weight ?? 1,
        publish_at:         publishAt,
        admin_boost:        0,
        seller_is_verified: sellerVerified ?? false,
      });

      // 3d. Set dates + rank_score on the ad
      const { error: adUpdateError } = await supabaseAdmin
        .from('ads')
        .update({
          publish_at: publishAt.toISOString(),
          expire_at:  expireAt.toISOString(),
          is_featured: isFeatured,
          rank_score:  rankScore,
          updated_at:  new Date().toISOString()
        })
        .eq('id', payment.ad_id);
      
      if (adUpdateError) throw adUpdateError;

      // 3e. Transition: payment_verified → published
      await transitionAdStatus({
        adId: payment.ad_id,
        newStatus: 'published',
        actorId: actor.id,
        note: 'Ad published immediately after payment verification',
        ipAddress: ip,
      });

      // 3f. Notify owner
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: adOwnerId,
          title: '🎉 Your ad is now live!',
          message: `Your payment was verified and your ad is now publicly visible. It will stay live for ${durationDays} days.`,
          type: 'ad_published',
          link: `/ads/${payment.ad_id}`
        });

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
    const { error: pRejectError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'rejected',
        rejection_note: rejection_note,
        verified_by: actor.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    if (pRejectError) throw pRejectError;

    // Roll back ad to payment_pending
    await transitionAdStatus({
      adId: payment.ad_id,
      newStatus: 'payment_pending',
      actorId: actor.id,
      note: `Payment rejected — ${rejection_note}`,
      ipAddress: ip,
    });

    // Notify owner
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: adOwnerId,
        title: 'Payment rejected',
        message: `Your payment was rejected. Reason: ${rejection_note}. Please submit a new payment.`,
        type: 'payment_rejected',
        link: `/ads/${payment.ad_id}/payment`
      });

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
