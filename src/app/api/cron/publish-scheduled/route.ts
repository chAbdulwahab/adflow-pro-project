import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
    // Find all ads ready to publish
    const scheduledAds = await db.query(
      `SELECT id, title, user_id FROM ads
       WHERE status = 'scheduled'
         AND publish_at <= NOW()
       ORDER BY publish_at ASC
       LIMIT 100` // Safety limit per run
    );

    if (scheduledAds.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled ads ready to publish',
        published: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // Transition each one — use a system actor ID placeholder
    // We use null actor for cron-driven transitions (logged as system)
    const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

    for (const ad of scheduledAds.rows) {
      try {
        await transitionAdStatus({
          adId: ad.id,
          newStatus: 'published',
          actorId: SYSTEM_ACTOR_ID,
          note: 'Auto-published by cron job (publish-scheduled)',
        });

        // Notify the owner
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, 'ad_published', $4)`,
          [
            ad.user_id,
            '🎉 Your ad is now live!',
            `"${ad.title}" has just gone live and is visible to buyers.`,
            `/ads/${ad.id}`,
          ]
        );

        results.push({ adId: ad.id, title: ad.title, success: true });
      } catch (err: any) {
        console.error(`Failed to publish ad ${ad.id}:`, err.message);
        results.push({ adId: ad.id, title: ad.title, success: false, error: err.message });
      }
    }

    const published = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success).length;

    // Log to system_health_logs
    await db.query(
      `INSERT INTO system_health_logs (source, response_ms, status, details)
       VALUES ('cron/publish-scheduled', $1, $2, $3)`,
      [
        Date.now() - startTime,
        failed === 0 ? 'ok' : 'warning',
        JSON.stringify({ published, failed, total: scheduledAds.rows.length }),
      ]
    );

    return NextResponse.json({
      success: true,
      published,
      failed,
      results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Cron publish-scheduled error:', error);

    await db.query(
      `INSERT INTO system_health_logs (source, response_ms, status, details)
       VALUES ('cron/publish-scheduled', $1, 'error', $2)`,
      [Date.now() - startTime, JSON.stringify({ error: error.message })]
    ).catch(() => {}); // Don't throw if logging fails

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
