import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { transitionAdStatus } from '@/lib/status-machine';
import { calculateRankScore } from '@/lib/rank';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// POST /api/admin/ads/[id]/publish — Steps 16–17: Publish or Schedule
//
// Requires: admin or super_admin
// Ad must be in 'payment_verified' status
//
// Body:
//   { publish_at?: ISO8601 string }
//   - If publish_at is in the future → scheduled
//   - If publish_at is omitted or now → published immediately
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRole(req, 'admin', 'super_admin');
    const { id: adId } = await params;

    const body = await req.json().catch(() => ({}));
    const publishAtRaw: string | undefined = body.publish_at;

    // 1. Fetch the ad with its package details (need duration_days for expire_at)
    const adResult = await db.query(
      `SELECT a.id, a.status, a.user_id, a.is_featured, a.admin_boost,
              p.duration_days, p.weight AS package_weight,
              sp.is_verified AS seller_verified
       FROM ads a
       LEFT JOIN packages p ON a.package_id = p.id
       LEFT JOIN seller_profiles sp ON sp.user_id = a.user_id
       WHERE a.id = $1`,
      [adId]
    );

    if (adResult.rows.length === 0) return errorResponse('Ad not found', 404);

    const ad = adResult.rows[0];

    if (ad.status !== 'payment_verified') {
      return errorResponse(
        `Ad is in '${ad.status}' status. Only 'payment_verified' ads can be published.`,
        422
      );
    }

    // 2. Determine publish_at and expire_at
    const now = new Date();
    const publishAt = publishAtRaw ? new Date(publishAtRaw) : now;

    if (isNaN(publishAt.getTime())) {
      return errorResponse('Invalid publish_at date format. Use ISO8601 (e.g. 2025-05-01T10:00:00Z)', 400);
    }

    const durationDays = ad.duration_days ?? 30;
    const expireAt = new Date(publishAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 3. Calculate rank score
    const rankScore = calculateRankScore({
      is_featured:       ad.is_featured,
      package_weight:    ad.package_weight ?? 1,
      publish_at:        publishAt,
      admin_boost:       ad.admin_boost ?? 0,
      seller_is_verified: ad.seller_verified ?? false,
    });

    // 4. Determine target status
    const isFuture    = publishAt.getTime() > now.getTime() + 60_000; // >1 min ahead
    const targetStatus = isFuture ? 'scheduled' : 'published';

    // 5. Update publish_at, expire_at, rank_score on the ad
    await db.query(
      `UPDATE ads
       SET publish_at = $1, expire_at = $2, rank_score = $3, updated_at = NOW()
       WHERE id = $4`,
      [publishAt.toISOString(), expireAt.toISOString(), rankScore, adId]
    );

    // 6. Transition status
    await transitionAdStatus({
      adId,
      newStatus: targetStatus as 'scheduled' | 'published',
      actorId: actor.id,
      note: isFuture
        ? `Scheduled for ${publishAt.toISOString()}`
        : 'Published immediately by admin',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    // 7. Notify owner
    const notifMessage = isFuture
      ? `Your ad is scheduled to go live on ${publishAt.toLocaleDateString('en-PK')}.`
      : 'Your ad is now live! It will be visible to buyers.';

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        ad.user_id,
        isFuture ? 'Ad scheduled!' : 'Ad is live!',
        notifMessage,
        isFuture ? 'ad_scheduled' : 'ad_published',
        `/ads/${adId}`,
      ]
    );

    return successResponse({
      message: isFuture
        ? `Ad scheduled for ${publishAt.toISOString()}`
        : 'Ad published immediately',
      adId,
      status: targetStatus,
      publish_at:  publishAt.toISOString(),
      expire_at:   expireAt.toISOString(),
      rank_score:  rankScore,
      duration_days: durationDays,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}
