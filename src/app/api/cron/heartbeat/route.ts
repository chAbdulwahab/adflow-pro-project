import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isCronAuthorized } from '@/lib/cron-auth';

// ============================================
// GET /api/cron/heartbeat — Step 24
// Runs every hour via Vercel Cron.
// Checks DB connectivity and logs system health.
// Also returns counts for proactive monitoring.
// ============================================
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [dbPing, adStats, paymentStats, recentErrors] = await Promise.all([
      // 1. DB latency ping
      db.query('SELECT NOW() AS time'),

      // 2. Ad status counts
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM ads
        GROUP BY status
        ORDER BY status
      `),

      // 3. Payment pending count
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM payments
        GROUP BY status
      `),

      // 4. Recent error logs (last 24h)
      db.query(`
        SELECT COUNT(*) AS error_count
        FROM system_health_logs
        WHERE status = 'error'
          AND checked_at > NOW() - INTERVAL '24 hours'
      `),
    ]);

    const responseMs = Date.now() - startTime;

    // Build structured health report
    const adStatusMap = Object.fromEntries(
      adStats.rows.map((r: { status: string; count: string }) => [r.status, parseInt(r.count)])
    );
    const paymentStatusMap = Object.fromEntries(
      paymentStats.rows.map((r: { status: string; count: string }) => [r.status, parseInt(r.count)])
    );

    const scheduledCount  = adStatusMap['scheduled']  ?? 0;
    const publishedCount  = adStatusMap['published']  ?? 0;
    const pendingPayments = paymentStatusMap['pending'] ?? 0;
    const errorCount      = parseInt(recentErrors.rows[0].error_count);

    // Determine overall health
    const overallStatus = errorCount > 10 ? 'warning' : 'ok';

    // Log to system_health_logs
    await db.query(
      `INSERT INTO system_health_logs (source, response_ms, status, details)
       VALUES ('cron/heartbeat', $1, $2, $3)`,
      [
        responseMs,
        overallStatus,
        JSON.stringify({
          db_latency_ms: responseMs,
          ads: adStatusMap,
          payments: paymentStatusMap,
          errors_24h: errorCount,
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      status: overallStatus,
      timestamp: dbPing.rows[0].time,
      db_latency_ms: responseMs,
      summary: {
        live_ads:         publishedCount,
        scheduled_ads:    scheduledCount,
        pending_payments: pendingPayments,
        errors_24h:       errorCount,
      },
      ads:      adStatusMap,
      payments: paymentStatusMap,
    });
  } catch (error: any) {
    console.error('Heartbeat cron error:', error);

    await db.query(
      `INSERT INTO system_health_logs (source, response_ms, status, details)
       VALUES ('cron/heartbeat', $1, 'error', $2)`,
      [Date.now() - startTime, JSON.stringify({ error: error.message })]
    ).catch(() => {});

    return NextResponse.json(
      { success: false, status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
