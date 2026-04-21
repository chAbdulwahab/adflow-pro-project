import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/moderator/ads — Step 11: Review queue
// Returns ads with status 'submitted' or 'under_review'
// Requires: moderator, admin, or super_admin
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'moderator', 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'submitted';
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    // Validate requested status
    const allowedStatuses = ['submitted', 'under_review'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(`status must be one of: ${allowedStatuses.join(', ')}`, 400);
    }

    const { data: adsResult, count, error } = await supabaseAdmin
      .from('ads')
      .select(`
        id, title, slug, status, price, description,
        created_at, updated_at,
        users!user_id ( 
          name, 
          email,
          seller_profiles ( is_verified )
        ),
        categories ( name ),
        cities ( name ),
        packages ( name, price ),
        ad_media ( normalized_thumbnail_url, validation_status, display_order )
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;

    const processedAds = (adsResult || []).map(ad => {
        const user = Array.isArray(ad.users) ? ad.users[0] : ad.users;
        const thumbnail = ad.ad_media
         ?.filter((m: any) => m.validation_status === 'valid')
         ?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]
         ?.normalized_thumbnail_url;
 
        return {
          ...ad,
          owner_name: user?.name,
          owner_email: user?.email,
          category_name: (Array.isArray(ad.categories) ? ad.categories[0] : ad.categories)?.name,
          city_name: (Array.isArray(ad.cities) ? ad.cities[0] : ad.cities)?.name,
          package_name: (Array.isArray(ad.packages) ? ad.packages[0] : ad.packages)?.name,
          package_price: (Array.isArray(ad.packages) ? ad.packages[0] : ad.packages)?.price,
          seller_verified: (Array.isArray(user?.seller_profiles) ? user.seller_profiles[0] : user?.seller_profiles)?.is_verified || false,
          thumbnail,
          users: undefined,
          categories: undefined,
          cities: undefined,
          packages: undefined,
          ad_media: undefined
        };
    });

    return successResponse({
      ads: processedAds,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
