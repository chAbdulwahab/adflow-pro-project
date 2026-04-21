import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isCronAuthorized } from '@/lib/cron-auth';
import { transitionAdStatus } from '@/lib/status-machine';

// ============================================
// GET /api/cron/expire-ads — Step 23
// Runs every 15 minutes via Vercel Cron.
// Finds all ads with status='published' AND expire_at <= NOW()
// and transitions them to 'expired'.
// ============================================
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: { adId: string; title: string; success: boolean; error?: string }[] = [];

  try {
    const now = new Date().toISOString();

    // Find all published ads that have now expired using Supabase
    const { data: expiredAds, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select('id, title, user_id, expire_at')
      .eq('status', 'published')
      .lte('expire_at', now)
      .order('expire_at', { ascending: true })
      .limit(100);

    if (fetchError) throw fetchError;

    if (!expiredAds || expiredAds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No ads to expire',
        expired: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

    for (const ad of expiredAds) {
      try {
        await transitionAdStatus({
          adId: ad.id,
          newStatus: 'expired',
          actorId: SYSTEM_ACTOR_ID,
          note: 'Auto-expired by cron job (expire-ads)',
        });

        // Notify the owner
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: ad.user_id,
            title: 'Your ad has expired',
            message: `"${ad.title}" has expired. You can renew it by selecting a new package.`,
            type: 'ad_expired',
            link: `/ads/${ad.id}`
          });

        results.push({ adId: ad.id, title: ad.title, success: true });
      } catch (err: any) {
        console.error(`Failed to expire ad ${ad.id}:`, err.message);
        results.push({ adId: ad.id, title: ad.title, success: false, error: err.message });
      }
    }

    const expired = results.filter(r => r.success).length;
    const failed  = results.filter(r => !r.success).length;

    await supabaseAdmin
      .from('system_health_logs')
      .insert({
        source: 'cron/expire-ads',
        response_ms: Date.now() - startTime,
        status: failed === 0 ? 'ok' : 'warning',
        details: { expired, failed, total: expiredAds.length }
      });

    return NextResponse.json({
      success: true,
      expired,
      failed,
      results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Cron expire-ads error:', error);

    await supabaseAdmin
      .from('system_health_logs')
      .insert({
        source: 'cron/expire-ads',
        response_ms: Date.now() - startTime,
        status: 'error',
        details: { error: error.message }
      });

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
