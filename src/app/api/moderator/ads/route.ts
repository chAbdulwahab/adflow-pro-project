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
       const thumbnail = ad.ad_media
        ?.filter((m: any) => m.validation_status === 'valid')
        ?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]
        ?.normalized_thumbnail_url;

       return {
         ...ad,
         owner_name: ad.users?.name,
         owner_email: ad.users?.email,
         category_name: ad.categories?.name,
         city_name: ad.cities?.name,
         package_name: ad.packages?.name,
         package_price: ad.packages?.price,
         seller_verified: ad.users?.seller_profiles?.[0]?.is_verified || false,
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
