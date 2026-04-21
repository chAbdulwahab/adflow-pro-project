import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';

// ============================================
// GET /api/public/meta — Step 20: Dropdown data for browse filters
// Returns active categories, cities, and packages in one request.
// NO auth required. Cached at the edge for performance.
// ============================================
export async function GET(_req: NextRequest) {
  try {
    const now = new Date().toISOString();

    // Fetch basic lists
    const [categoriesRes, citiesRes, packagesRes, liveAdsRes, featuredAdsRes, activeCitiesRes] = await Promise.all([
      supabaseAdmin.from('categories').select('id, name, slug').eq('is_active', true).order('name'),
      supabaseAdmin.from('cities').select('id, name, slug').eq('is_active', true).order('name'),
      supabaseAdmin.from('packages').select('id, name, duration_days, price, is_featured, description').eq('is_active', true).order('price'),
      // Stats counts
      supabaseAdmin.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('expire_at', now),
      supabaseAdmin.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published').gt('expire_at', now).eq('is_featured', true),
      supabaseAdmin.from('ads').select('city_id').eq('status', 'published').gt('expire_at', now) // For distinct cities calculation
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (citiesRes.error)     throw citiesRes.error;
    if (packagesRes.error)   throw packagesRes.error;

    // For ad counts per category/city, we'll fetch partial data and count in memory
    // (This is a simplification; for very large datasets, a DB view or RPC would be better)
    const { data: allLiveAds } = await supabaseAdmin
      .from('ads')
      .select('category_id, city_id')
      .eq('status', 'published')
      .gt('expire_at', now);

    const ads = allLiveAds || [];
    
    const categoryCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const activeCitiesSet = new Set<string>();

    ads.forEach(ad => {
      categoryCounts[ad.category_id] = (categoryCounts[ad.category_id] || 0) + 1;
      cityCounts[ad.city_id] = (cityCounts[ad.city_id] || 0) + 1;
      activeCitiesSet.add(ad.city_id);
    });

    const categories = categoriesRes.data.map(cat => ({
      ...cat,
      ad_count: categoryCounts[cat.id] || 0
    }));

    const cities = citiesRes.data.map(city => ({
      ...city,
      ad_count: cityCounts[city.id] || 0
    }));

    return successResponse({
      categories,
      cities,
      packages: packagesRes.data,
      stats: {
        live_ads:      liveAdsRes.count || 0,
        featured_ads:  featuredAdsRes.count || 0,
        active_cities: activeCitiesSet.size,
      },
    });
  } catch (error: any) {
    console.error('Meta error:', error);
    return errorResponse(error.message || 'Failed to fetch metadata', 500);
  }
}
