import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';

// ============================================
// GET /api/public/ads/[slug] — Step 19: Public ad detail by slug
// NO auth required. Only serves published, non-expired ads.
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Fetch the ad (enforce public visibility rules) using Supabase
    const { data: adData, error: adError } = await supabaseAdmin
      .from('ads')
      .select(`
        id, user_id, title, slug, description, price,
        is_featured, rank_score, publish_at, expire_at, created_at,
        category_id,
        categories ( name, slug ),
        cities ( name, slug ),
        packages ( name ),
        users!user_id ( 
          name, 
          seller_profiles ( display_name, business_name, phone, city, is_verified )
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .gt('expire_at', new Date().toISOString())
      .maybeSingle();

    if (adError) throw adError;
    if (!adData) {
      return errorResponse('Ad not found or no longer available', 404);
    }

    // Flatten ad data
    const user = Array.isArray(adData.users) ? adData.users[0] : adData.users;
    const sellerProfile = Array.isArray(user?.seller_profiles) ? user.seller_profiles[0] : user?.seller_profiles;
    const cat = Array.isArray(adData.categories) ? adData.categories[0] : adData.categories;
    const cit = Array.isArray(adData.cities) ? adData.cities[0] : adData.cities;
    const pkg = Array.isArray(adData.packages) ? adData.packages[0] : adData.packages;

    const ad = {
      ...adData,
      category_name: cat?.name,
      category_slug: cat?.slug,
      city_name:     cit?.name,
      city_slug:     cit?.slug,
      package_name:  pkg?.name,
      owner_name:    user?.name,
      seller_display_name:  sellerProfile?.display_name || user?.name,
      seller_business_name: sellerProfile?.business_name,
      seller_phone:         sellerProfile?.phone,
      seller_city:          sellerProfile?.city,
      seller_verified:      sellerProfile?.is_verified || false,
      categories: undefined,
      cities:     undefined,
      packages:   undefined,
      users:      undefined,
      seller_profiles: undefined
    };

    // 2. Fetch all valid media for this ad
    const { data: mediaResult, error: mediaError } = await supabaseAdmin
      .from('ad_media')
      .select('source_type, original_url, normalized_thumbnail_url, display_order')
      .eq('ad_id', ad.id)
      .eq('validation_status', 'valid')
      .order('display_order', { ascending: true });

    if (mediaError) throw mediaError;

    // 3. Fetch related ads (same category, excluding this one, limit 4)
    const { data: relatedData, error: relatedError } = await supabaseAdmin
      .from('ads')
      .select(`
        id, title, slug, price, is_featured,
        cities ( name ),
        ad_media ( normalized_thumbnail_url )
      `)
      .eq('status', 'published')
      .gt('expire_at', new Date().toISOString())
      .eq('category_id', adData.category_id)
      .neq('slug', slug)
      .filter('ad_media.validation_status', 'eq', 'valid')
      .order('rank_score', { ascending: false })
      .limit(4);

    if (relatedError) throw relatedError;

    const relatedAds = (relatedData || []).map(r => ({
      ...r,
      city_name: (Array.isArray(r.cities) ? r.cities[0] : r.cities)?.name,
      thumbnail: r.ad_media?.[0]?.normalized_thumbnail_url,
      cities: undefined,
      ad_media: undefined
    }));

    return successResponse({
      ad: {
        ...ad,
        media: mediaResult || [],
      },
      related_ads: relatedAds,
    });
  } catch (error: any) {
    console.error('Ad detail error:', error);
    return errorResponse(error.message || 'Failed to fetch ad', 500);
  }
}
