import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { successResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/dashboard/analytics
// Returns seller-specific analytics for their own ads only.
// ============================================
export async function GET(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30')));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();
    const now = new Date();

    // 1. Fetch the seller's own ads (all time — for lifetime counts)
    const { data: adsRaw, error: adsError } = await supabaseAdmin
      .from('ads')
      .select('id, title, slug, status, created_at, expire_at, is_featured, price')
      .eq('user_id', actor.id);

    if (adsError) throw adsError;
    const ads = adsRaw || [];
    const adIds = ads.map(a => a.id);

    if (adIds.length === 0) {
      return successResponse({
        period_days: days,
        kpis: { total_ads: 0, live_ads: 0, total_views: 0, views_this_period: 0, whatsapp_clicks: 0, expiring_soon: 0 },
        charts: { views_over_time: [], top_ads_by_views: [], status_breakdown: [], views_by_day_of_week: [] },
        per_ad: [],
      });
    }

    // 2. Fetch view counts for all seller's ads (within period)
    const { data: viewsRaw } = await supabaseAdmin
      .from('ad_views')
      .select('ad_id, viewed_at')
      .in('ad_id', adIds);

    const allViews = viewsRaw || [];
    const periodViews = allViews.filter(v => new Date(v.viewed_at) >= startDate);

    // 3. KPIs
    const liveAds = ads.filter(a => a.status === 'published' && new Date(a.expire_at) > now);
    const expiringSoon = liveAds.filter(a => {
      const daysLeft = (new Date(a.expire_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 3;
    });

    const kpis = {
      total_ads:       ads.length,
      live_ads:        liveAds.length,
      total_views:     allViews.length,
      views_this_period: periodViews.length,
      expiring_soon:   expiringSoon.length,
    };

    // 4. Chart: Views over time (daily, within period)
    const viewsByDay: Record<string, number> = {};
    periodViews.forEach(v => {
      const key = new Date(v.viewed_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      viewsByDay[key] = (viewsByDay[key] || 0) + 1;
    });
    const views_over_time = Object.entries(viewsByDay).map(([date, views]) => ({ date, views }));

    // 5. Chart: Top ads by views (lifetime)
    const viewsByAdId: Record<string, number> = {};
    allViews.forEach(v => {
      viewsByAdId[v.ad_id] = (viewsByAdId[v.ad_id] || 0) + 1;
    });
    const top_ads_by_views = ads
      .map(a => ({ title: a.title.slice(0, 30) + (a.title.length > 30 ? '…' : ''), slug: a.slug, views: viewsByAdId[a.id] || 0, status: a.status }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // 6. Chart: Status breakdown
    const statusCounts: Record<string, number> = {};
    ads.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
    const status_breakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 7. Chart: Views by day of week (within period)
    const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
    periodViews.forEach(v => { dowCounts[new Date(v.viewed_at).getDay()]++; });
    const views_by_day_of_week = DOW.map((day, i) => ({ day, views: dowCounts[i] }));

    // 8. Per-ad breakdown table
    const per_ad = ads.map(a => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      is_featured: a.is_featured,
      price: a.price,
      created_at: a.created_at,
      expire_at: a.expire_at,
      total_views: viewsByAdId[a.id] || 0,
      period_views: periodViews.filter(v => v.ad_id === a.id).length,
    })).sort((a, b) => b.total_views - a.total_views);

    return successResponse({
      period_days: days,
      kpis,
      charts: { views_over_time, top_ads_by_views, status_breakdown, views_by_day_of_week },
      per_ad,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
