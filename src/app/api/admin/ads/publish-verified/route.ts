import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Find all ads stuck at payment_verified using Supabase
    const { data: stuckAds, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select(`
        id, title, user_id, admin_boost,
        packages ( duration_days, is_featured, weight ),
        seller_profiles!user_id ( is_verified )
      `)
      .eq('status', 'payment_verified')
      .order('updated_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!stuckAds || stuckAds.length === 0) {
      return successResponse({ message: 'No ads stuck at payment_verified.', published: 0 });
    }

    const results: { adId: string; title: string; success: boolean; error?: string }[] = [];

    for (const ad of stuckAds) {
      try {
        const pkg: any = Array.isArray(ad.packages) ? ad.packages[0] : ad.packages;
        const durationDays: number = pkg?.duration_days ?? 30;
        const publishAt  = new Date();
        const expireAt   = new Date(publishAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const isFeatured: boolean = pkg?.is_featured ?? false;

        const sellerProf = Array.isArray(ad.seller_profiles) ? ad.seller_profiles[0] : ad.seller_profiles;
        const rankScore = calculateRankScore({
          is_featured:        isFeatured,
          package_weight:     pkg?.weight ?? 1,
          publish_at:         publishAt,
          admin_boost:        ad.admin_boost ?? 0,
          seller_is_verified: sellerProf?.is_verified ?? false,
        });

        // Set dates & features
        const { error: updateError } = await supabaseAdmin
          .from('ads')
          .update({
            publish_at: publishAt.toISOString(),
            expire_at:  expireAt.toISOString(),
            is_featured: isFeatured,
            rank_score:  rankScore,
            updated_at:  new Date().toISOString()
          })
          .eq('id', ad.id);
        
        if (updateError) throw updateError;

        // Transition to published
        await transitionAdStatus({
          adId: ad.id,
          newStatus: 'published',
          actorId: actor.id,
          note: 'Manually published via admin fix (was stuck at payment_verified)',
        });

        // Notify owner
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: ad.user_id,
            title: '🎉 Your ad is now live!',
            message: `Your ad "${ad.title}" has been published and is now publicly visible.`,
            type: 'ad_published',
            link: `/ads/${ad.id}`
          });

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
