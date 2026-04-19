import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
    // Find all published ads that have now expired
    const expiredAds = await db.query(
      `SELECT id, title, user_id, expire_at FROM ads
       WHERE status = 'published'
         AND expire_at <= NOW()
       ORDER BY expire_at ASC
       LIMIT 100`
    );

    if (expiredAds.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No ads to expire',
        expired: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

    for (const ad of expiredAds.rows) {
      try {
        await transitionAdStatus({
          adId: ad.id,
          newStatus: 'expired',
          actorId: SYSTEM_ACTOR_ID,
          note: 'Auto-expired by cron job (expire-ads)',
        });

        // Notify the owner
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, link)
           VALUES ($1, $2, $3, 'ad_expired', $4)`,
          [
            ad.user_id,
            'Your ad has expired',
            `"${ad.title}" has expired. You can renew it by selecting a new package.`,
            `/ads/${ad.id}`,
          ]
        );

        results.push({ adId: ad.id, title: ad.title, success: true });
      } catch (err: any) {
        console.error(`Failed to expire ad ${ad.id}:`, err.message);
        results.push({ adId: ad.id, title: ad.title, success: false, error: err.message });
      }
    }

    const expired = results.filter(r => r.success).length;
    const failed  = results.filter(r => !r.success).length;

    await db.query(
      `INSERT INTO system_health_logs (source, response_ms, status, details)
       VALUES ('cron/expire-ads', $1, $2, $3)`,
      [
        Date.now() - startTime,
        failed === 0 ? 'ok' : 'warning',
        JSON.stringify({ expired, failed, total: expiredAds.rows.length }),
      ]
    );

    return NextResponse.json({
      success: true,
      expired,
      failed,
      results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Cron expire-ads error:', error);

    await db.query(
      `INSERT INTO system_health_logs (source, response_ms, status, details)
       VALUES ('cron/expire-ads', $1, 'error', $2)`,
      [Date.now() - startTime, JSON.stringify({ error: error.message })]
    ).catch(() => {});

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
