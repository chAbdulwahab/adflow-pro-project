import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { successResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/admin/health — Step 27: System health overview
// Requires: admin or super_admin
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const startTime = Date.now();

    const [dbPing, attentionItems, recentLogs, logSummary] = await Promise.all([

      // DB connectivity + version
      db.query('SELECT NOW() AS time, version() AS pg_version'),

      // Items needing admin attention
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'submitted')          AS ads_awaiting_review,
          COUNT(*) FILTER (WHERE status = 'payment_submitted')  AS ads_awaiting_payment_verify,
          COUNT(*) FILTER (WHERE status = 'payment_verified')   AS ads_awaiting_publish,
          COUNT(*) FILTER (WHERE status = 'scheduled')          AS ads_scheduled,
          COUNT(*) FILTER (WHERE status = 'published' AND expire_at <= NOW() + INTERVAL '3 days'
                            AND expire_at > NOW())              AS ads_expiring_soon
        FROM ads
      `),

      // Recent system health log entries (last 50)
      db.query(`
        SELECT source, response_ms, status, details, checked_at
        FROM system_health_logs
        ORDER BY checked_at DESC
        LIMIT 50
      `),

      // 24h log summary
      db.query(`
        SELECT
          status,
          COUNT(*)::INT   AS count,
          AVG(response_ms)::INT AS avg_ms
        FROM system_health_logs
        WHERE checked_at >= NOW() - INTERVAL '24 hours'
        GROUP BY status
      `),
    ]);

    const dbLatencyMs = Date.now() - startTime;
    const logSummaryMap = Object.fromEntries(
      logSummary.rows.map((r: { status: string; count: number; avg_ms: number }) => [
        r.status, { count: r.count, avg_ms: r.avg_ms }
      ])
    );

    const overallStatus =
      (logSummaryMap['error']?.count ?? 0) > 5 ? 'degraded' :
      (logSummaryMap['warning']?.count ?? 0) > 10 ? 'warning' : 'healthy';

    return successResponse({
      status: overallStatus,
      db: {
        connected: true,
        latency_ms: dbLatencyMs,
        time: dbPing.rows[0].time,
        version: dbPing.rows[0].pg_version.split(' ')[0] + ' ' + dbPing.rows[0].pg_version.split(' ')[1],
      },
      attention: attentionItems.rows[0],
      logs_24h: logSummaryMap,
      recent_logs: recentLogs.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
