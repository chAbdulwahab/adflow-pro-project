import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Run all health checks in parallel using Supabase client
    const [adStatsRes, paymentStatsRes, recentErrorsRes] = await Promise.all([
      // 1. Ad status counts
      supabaseAdmin.from('ads').select('status'),
      // 2. Payment status counts
      supabaseAdmin.from('payments').select('status'),
      // 3. Recent error logs (last 24h)
      supabaseAdmin
        .from('system_health_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')
        .gt('checked_at', yesterday)
    ]);

    if (adStatsRes.error) throw adStatsRes.error;
    if (paymentStatsRes.error) throw paymentStatsRes.error;

    // Process stats in memory
    const adStatusMap: Record<string, number> = {};
    (adStatsRes.data || []).forEach(a => {
      adStatusMap[a.status] = (adStatusMap[a.status] || 0) + 1;
    });

    const paymentStatusMap: Record<string, number> = {};
    (paymentStatsRes.data || []).forEach(p => {
      paymentStatusMap[p.status] = (paymentStatusMap[p.status] || 0) + 1;
    });

    const responseMs = Date.now() - startTime;
    const errorCount = recentErrorsRes.count || 0;
    const overallStatus = errorCount > 10 ? 'warning' : 'ok';

    // Log to system_health_logs
    await supabaseAdmin
      .from('system_health_logs')
      .insert({
        source: 'cron/heartbeat',
        response_ms: responseMs,
        status: overallStatus,
        details: {
          db_latency_ms: responseMs,
          ads: adStatusMap,
          payments: paymentStatusMap,
          errors_24h: errorCount,
        }
      });

    return NextResponse.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      db_latency_ms: responseMs,
      summary: {
        live_ads:         adStatusMap['published'] ?? 0,
        scheduled_ads:    adStatusMap['scheduled'] ?? 0,
        pending_payments: paymentStatusMap['pending'] ?? 0,
        errors_24h:       errorCount,
      },
      ads:      adStatusMap,
      payments: paymentStatusMap,
    });
  } catch (error: any) {
    console.error('Heartbeat cron error:', error);

    await supabaseAdmin
      .from('system_health_logs')
      .insert({
        source: 'cron/heartbeat',
        response_ms: Date.now() - startTime,
        status: 'error',
        details: { error: error.message }
      }).catch(() => {});

    return NextResponse.json(
      { success: false, status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
