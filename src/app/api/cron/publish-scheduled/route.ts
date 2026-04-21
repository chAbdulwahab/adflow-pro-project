import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isCronAuthorized } from '@/lib/cron-auth';
import { transitionAdStatus } from '@/lib/status-machine';

// ============================================
// GET /api/cron/publish-scheduled — Step 22
// Runs every 5 minutes via Vercel Cron.
// Finds all ads with status='scheduled' AND publish_at <= NOW()
// and transitions them to 'published'.
// ============================================
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: { adId: string; title: string; success: boolean; error?: string }[] = [];

  try {
    const now = new Date().toISOString();

    // Find all ads ready to publish using Supabase
    const { data: scheduledAds, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select('id, title, user_id')
      .eq('status', 'scheduled')
      .lte('publish_at', now)
      .order('publish_at', { ascending: true })
      .limit(100);

    if (fetchError) throw fetchError;

    if (!scheduledAds || scheduledAds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled ads ready to publish',
        published: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // Transition each one — use a system actor ID placeholder
    const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

    for (const ad of scheduledAds) {
      try {
        await transitionAdStatus({
          adId: ad.id,
          newStatus: 'published',
          actorId: SYSTEM_ACTOR_ID,
          note: 'Auto-published by cron job (publish-scheduled)',
        });

        // Notify the owner
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: ad.user_id,
            title: '🎉 Your ad is now live!',
            message: `"${ad.title}" has just gone live and is visible to buyers.`,
            type: 'ad_published',
            link: `/ads/${ad.id}`
          });

        results.push({ adId: ad.id, title: ad.title, success: true });
      } catch (err: any) {
        console.error(`Failed to publish ad ${ad.id}:`, err.message);
        results.push({ adId: ad.id, title: ad.title, success: false, error: err.message });
      }
    }

    const published = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success).length;

    // Log to system_health_logs
    await supabaseAdmin
      .from('system_health_logs')
      .insert({
        source: 'cron/publish-scheduled',
        response_ms: Date.now() - startTime,
        status: failed === 0 ? 'ok' : 'warning',
        details: { published, failed, total: scheduledAds.length }
      });

    return NextResponse.json({
      success: true,
      published,
      failed,
      results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Cron publish-scheduled error:', error);

    await supabaseAdmin
      .from('system_health_logs')
      .insert({
        source: 'cron/publish-scheduled',
        response_ms: Date.now() - startTime,
        status: 'error',
        details: { error: error.message }
      }).catch(() => {});

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
