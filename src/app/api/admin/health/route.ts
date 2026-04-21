import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { successResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/admin/health
// System health overview using JS-based checks.
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const startTime = Date.now();
    const now = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch raw data in parallel
    const [adsRes, logsRes] = await Promise.all([
      supabaseAdmin.from('ads').select('status, expire_at'),
      supabaseAdmin.from('system_health_logs').select('*').gt('checked_at', yesterday).order('checked_at', { ascending: false })
    ]);

    const dbLatencyMs = Date.now() - startTime;
    const allAds = adsRes.data || [];
    const recentLogs = logsRes.data || [];

    // 2. Aggregate Attention items
    const attention = {
      ads_awaiting_review: allAds.filter(a => a.status === 'submitted').length,
      ads_awaiting_payment_verify: allAds.filter(a => a.status === 'payment_submitted').length,
      ads_awaiting_publish: allAds.filter(a => a.status === 'payment_verified').length,
      ads_scheduled: allAds.filter(a => a.status === 'scheduled').length,
      ads_expiring_soon: allAds.filter(a => a.status === 'published' && a.expire_at <= soon && a.expire_at > now.toISOString()).length,
    };

    // 3. Aggregate Log Summary (24h)
    const logSummaryMap: Record<string, { count: number; avg_ms: number; total_ms: number }> = {};
    recentLogs.forEach(log => {
      if (!logSummaryMap[log.status]) {
        logSummaryMap[log.status] = { count: 0, avg_ms: 0, total_ms: 0 };
      }
      logSummaryMap[log.status].count += 1;
      logSummaryMap[log.status].total_ms += (log.response_ms || 0);
    });

    Object.values(logSummaryMap).forEach(s => {
      s.avg_ms = Math.round(s.total_ms / s.count);
    });

    const overallStatus =
      (logSummaryMap['error']?.count ?? 0) > 5 ? 'degraded' :
      (logSummaryMap['warning']?.count ?? 0) > 10 ? 'warning' : 'healthy';

    return successResponse({
      status: overallStatus,
      db: {
        connected: true,
        latency_ms: dbLatencyMs,
        time: now.toISOString(),
        version: 'Cloud PostgreSQL', // We can't get version without a raw SQL query or RPC
      },
      attention,
      logs_24h: logSummaryMap,
      recent_logs: recentLogs.slice(0, 50),
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
