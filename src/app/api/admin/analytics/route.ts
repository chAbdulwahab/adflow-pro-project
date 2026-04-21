import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { successResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/admin/analytics
// Returns data for 5 dashboard charts using JS-based aggregation.
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30')));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();

    // 1. Fetch all required raw data in parallel
    const [adsRes, paymentsRes, categoriesRes, citiesRes, usersRes] = await Promise.all([
      supabaseAdmin.from('ads').select('status, created_at, category_id, city_id, is_featured, expire_at'),
      supabaseAdmin.from('payments').select('amount, created_at').eq('status', 'verified').gt('created_at', startDateISO),
      supabaseAdmin.from('categories').select('id, name'),
      supabaseAdmin.from('cities').select('id, name'),
      supabaseAdmin.from('users').select('id').eq('role', 'client')
    ]);

    const allAds = adsRes.data || [];
    const verifiedPayments = paymentsRes.data || [];
    const categoriesMap = Object.fromEntries((categoriesRes.data || []).map(c => [c.id, c.name]));
    const citiesMap = Object.fromEntries((citiesRes.data || []).map(c => [c.id, c.name]));

    // 2. Aggregate KPIs
    const now = new Date();
    const kpis = {
      live_ads: allAds.filter(a => a.status === 'published' && new Date(a.expire_at) > now).length,
      pending_review: allAds.filter(a => a.status === 'submitted').length,
      pending_payment: allAds.filter(a => a.status === 'payment_submitted').length,
      total_revenue: verifiedPayments.reduce((sum, p) => sum + p.amount, 0),
      total_clients: (usersRes.data || []).length,
      ads_this_week: allAds.filter(a => new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    };

    // 3. Aggregate Chart: Ad Status Distribution
    const statusCounts: Record<string, number> = {};
    allAds.forEach(ad => {
      statusCounts[ad.status] = (statusCounts[ad.status] || 0) + 1;
    });
    const ad_status_distribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 4. Aggregate Chart: Revenue Over Time
    const revenueByDay: Record<string, number> = {};
    verifiedPayments.forEach(p => {
      const dateKey = new Date(p.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + p.amount;
    });
    const revenue_over_time = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));

    // 5. Aggregate Chart: Ads Over Time
    const adsByDay: Record<string, number> = {};
    allAds.filter(a => new Date(a.created_at) > startDate).forEach(a => {
      const dateKey = new Date(a.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      adsByDay[dateKey] = (adsByDay[dateKey] || 0) + 1;
    });
    const ads_over_time = Object.entries(adsByDay).map(([date, ads_created]) => ({ date, ads_created }));

    // 6. Aggregate Chart: Top Categories
    const categoryCounts: Record<string, number> = {};
    allAds.filter(a => a.status === 'published' && new Date(a.expire_at) > now).forEach(a => {
      const name = categoriesMap[a.category_id] || 'Unknown';
      categoryCounts[name] = (categoryCounts[name] || 0) + 1;
    });
    const top_categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 7. Aggregate Chart: Top Cities
    const cityCounts: Record<string, number> = {};
    allAds.filter(a => a.status === 'published' && new Date(a.expire_at) > now).forEach(a => {
      const name = citiesMap[a.city_id] || 'Unknown';
      cityCounts[name] = (cityCounts[name] || 0) + 1;
    });
    const top_cities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return successResponse({
      period_days: days,
      kpis,
      charts: {
        ad_status_distribution,
        revenue_over_time,
        ads_over_time,
        top_categories,
        top_cities,
      },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
