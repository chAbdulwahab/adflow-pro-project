import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';

// ============================================
// GET /api/public/ads — Step 18: Public browse with filters + pagination
// NO auth required. Only returns published, non-expired ads.
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q        = searchParams.get('q')?.trim() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';
    const city     = searchParams.get('city')?.trim() ?? '';
    const minPrice = parseFloat(searchParams.get('min_price') ?? '0') || 0;
    const maxPrice = parseFloat(searchParams.get('max_price') ?? '0') || 0;
    const featured = searchParams.get('featured') === 'true';
    const pkg      = searchParams.get('package')?.trim() ?? '';
    const sort     = searchParams.get('sort') ?? 'rank_score';
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset   = (page - 1) * limit;

    const now = new Date().toISOString();

    // Start building query
    let query = supabaseAdmin
      .from('ads')
      .select(`
        id, title, slug, price, is_featured,
        rank_score, publish_at, expire_at, created_at,
        categories ( name, slug ),
        cities ( name, slug ),
        packages ( name ),
        users!user_id ( 
          name,
          seller_profiles ( display_name, is_verified )
        ),
        ad_media ( normalized_thumbnail_url, validation_status, display_order )
      `, { count: 'exact' })
      .eq('status', 'published')
      .gt('expire_at', now);

    // Apply filters
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (category) {
      query = query.eq('categories.slug', category);
    }
    if (city) {
      query = query.eq('cities.slug', city);
    }
    if (minPrice > 0) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice > 0) {
      query = query.lte('price', maxPrice);
    }
    if (featured) {
      query = query.eq('is_featured', true);
    }
    if (pkg) {
      query = query.ilike('packages.name', pkg);
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('publish_at', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: false });
        break;
      default: // rank_score
        query = query.order('rank_score', { ascending: false }).order('publish_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: adsResult, count, error } = await query;

    if (error) throw error;

    // Post-process to flatten and handle thumbnail
    const processedAds = (adsResult || []).map(ad => {
      // Find first valid thumbnail
      const thumbnail = ad.ad_media
        ?.filter((m: any) => m.validation_status === 'valid')
        ?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]
        ?.normalized_thumbnail_url;

      // Extract seller info from users/seller_profiles
      const sellerProfile = ad.users?.seller_profiles?.[0];
      const sellerDisplayName = sellerProfile?.display_name || ad.users?.name;
      const sellerVerified = sellerProfile?.is_verified || false;

      return {
        id: ad.id,
        title: ad.title,
        slug: ad.slug,
        price: ad.price,
        is_featured: ad.is_featured,
        rank_score: ad.rank_score,
        publish_at: ad.publish_at,
        expire_at: ad.expire_at,
        created_at: ad.created_at,
        category_name: ad.categories?.name,
        category_slug: ad.categories?.slug,
        city_name: ad.cities?.name,
        city_slug: ad.cities?.slug,
        package_name: ad.packages?.name,
        seller_name: sellerDisplayName,
        seller_verified: sellerVerified,
        thumbnail
      };
    });

    const total = count || 0;

    return successResponse({
      ads: processedAds,
      filters: { q, category, city, min_price: minPrice, max_price: maxPrice, featured, sort },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Public browse error:', error);
    return errorResponse(error.message || 'Failed to fetch ads', 500);
  }
}
