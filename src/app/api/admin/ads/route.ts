import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('ads')
      .select(`
        id, title, slug, status, price, 
        created_at, updated_at,
        users!user_id ( 
          name, 
          email
        ),
        categories ( name ),
        cities ( name ),
        packages ( name )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: adsResult, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;

    const processedAds = (adsResult || []).map(ad => {
        const user = Array.isArray(ad.users) ? ad.users[0] : ad.users;
 
        return {
          ...ad,
          owner_name: user?.name,
          owner_email: user?.email,
          category_name: (Array.isArray(ad.categories) ? ad.categories[0] : ad.categories)?.name,
          city_name: (Array.isArray(ad.cities) ? ad.cities[0] : ad.cities)?.name,
          package_name: (Array.isArray(ad.packages) ? ad.packages[0] : ad.packages)?.name,
          users: undefined,
          categories: undefined,
          cities: undefined,
          packages: undefined
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
