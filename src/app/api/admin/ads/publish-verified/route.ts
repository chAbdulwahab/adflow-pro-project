import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { transitionAdStatus } from '@/lib/status-machine';
import { calculateRankScore } from '@/lib/rank';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// POST /api/admin/ads/publish-verified
// One-off utility: publishes ALL ads stuck in 'payment_verified' status.
// Requires: admin or super_admin
// ============================================
export async function POST(req: NextRequest) {
  try {
    const actor = requireRole(req, 'admin', 'super_admin');

    // Find all ads stuck at payment_verified
    const stuckAds = await db.query(
      `SELECT
         a.id, a.title, a.user_id, a.admin_boost,
         pkg.duration_days,
         pkg.is_featured  AS pkg_is_featured,
         pkg.weight       AS pkg_weight,
         sp.is_verified   AS seller_verified
       FROM ads a
       LEFT JOIN packages pkg        ON a.package_id = pkg.id
       LEFT JOIN seller_profiles sp  ON sp.user_id   = a.user_id
       WHERE a.status = 'payment_verified'
       ORDER BY a.updated_at ASC`
    );

    if (stuckAds.rows.length === 0) {
      return successResponse({ message: 'No ads stuck at payment_verified.', published: 0 });
    }

    const results: { adId: string; title: string; success: boolean; error?: string }[] = [];

    for (const ad of stuckAds.rows) {
      try {
        const durationDays: number = ad.duration_days ?? 30;
        const publishAt  = new Date();
        const expireAt   = new Date(publishAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const isFeatured: boolean = ad.pkg_is_featured ?? false;

        const rankScore = calculateRankScore({
          is_featured:        isFeatured,
          package_weight:     ad.pkg_weight ?? 1,
          publish_at:         publishAt,
          admin_boost:        ad.admin_boost ?? 0,
          seller_is_verified: ad.seller_verified ?? false,
        });

        // Set dates & features
        await db.query(
          `UPDATE ads
           SET publish_at = $1, expire_at = $2, is_featured = $3, rank_score = $4, updated_at = NOW()
           WHERE id = $5`,
          [publishAt, expireAt, isFeatured, rankScore, ad.id]
        );

        // Transition to published
        await transitionAdStatus({
          adId: ad.id,
          newStatus: 'published',
          actorId: actor.id,
          note: 'Manually published via admin fix (was stuck at payment_verified)',
        });

        // Notify owner
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, 'ad_published', $4)`,
          [
            ad.user_id,
            '🎉 Your ad is now live!',
            `Your ad "${ad.title}" has been published and is now publicly visible.`,
            `/ads/${ad.id}`,
          ]
        );

        results.push({ adId: ad.id, title: ad.title, success: true });
      } catch (err: any) {
        results.push({ adId: ad.id, title: ad.title, success: false, error: err.message });
      }
    }

    const published = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success).length;

    return successResponse({
      message: `Published ${published} stuck ad(s).`,
      published,
      failed,
      results,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
