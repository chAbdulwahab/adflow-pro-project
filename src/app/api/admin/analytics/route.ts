import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/admin/analytics — Step 25
// Returns data for 5 dashboard charts.
// Requires: admin or super_admin
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30')));

    const [
      adStatusDist,
      revenueOverTime,
      adsOverTime,
      topCategories,
      topCities,
      kpiStats,
    ] = await Promise.all([

      // Chart 1: Ad Status Distribution (Pie Chart)
      db.query(`
        SELECT status AS name, COUNT(*) AS value
        FROM ads
        GROUP BY status
        ORDER BY value DESC
      `),

      // Chart 2: Revenue Over Time (Line Chart)
      db.query(`
        SELECT
          DATE_TRUNC('day', created_at) AS date,
          SUM(amount)::FLOAT            AS revenue,
          COUNT(*)::INT                 AS payment_count
        FROM payments
        WHERE status = 'verified'
          AND created_at >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `, [days]),

      // Chart 3: New Ads Per Day (Bar Chart)
      db.query(`
        SELECT
          DATE_TRUNC('day', created_at) AS date,
          COUNT(*)::INT AS ads_created
        FROM ads
        WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `, [days]),

      // Chart 4: Top Categories by published ads (Horizontal Bar)
      db.query(`
        SELECT
          c.name AS category,
          COUNT(*) AS count
        FROM ads a
        JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' AND a.expire_at > NOW()
        GROUP BY c.name
        ORDER BY count DESC
        LIMIT 8
      `),

      // Chart 5: Top Cities by active ads (Horizontal Bar)
      db.query(`
        SELECT
          ct.name AS city,
          COUNT(*) AS count
        FROM ads a
        JOIN cities ct ON a.city_id = ct.id
        WHERE a.status = 'published' AND a.expire_at > NOW()
        GROUP BY ct.name
        ORDER BY count DESC
        LIMIT 8
      `),

      // KPI cards
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'published' AND expire_at > NOW())  AS live_ads,
          COUNT(*) FILTER (WHERE status = 'submitted')                         AS pending_review,
          COUNT(*) FILTER (WHERE status = 'payment_submitted')                 AS pending_payment,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'verified')::FLOAT AS total_revenue,
          (SELECT COUNT(*) FROM users WHERE role = 'client')::INT              AS total_clients,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')     AS ads_this_week
        FROM ads
      `),
    ]);

    // Format dates as readable strings
    const formatDate = (row: { date: string | Date }) => ({
      ...row,
      date: new Date(row.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
    });

    return successResponse({
      period_days: days,
      kpis: kpiStats.rows[0],
      charts: {
        ad_status_distribution: adStatusDist.rows.map(r => ({
          name: r.name,
          value: parseInt(r.value),
        })),
        revenue_over_time:  revenueOverTime.rows.map(formatDate),
        ads_over_time:      adsOverTime.rows.map(formatDate),
        top_categories:     topCategories.rows.map(r => ({ ...r, count: parseInt(r.count) })),
        top_cities:         topCities.rows.map(r => ({ ...r, count: parseInt(r.count) })),
      },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
