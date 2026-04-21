import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { adCreateSchema } from '@/lib/validators';
import { generateUniqueSlug } from '@/lib/slug';
import { normalizeMediaUrls } from '@/lib/media';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// POST /api/ads — Step 9: Create a new ad (draft)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const body = await req.json();
    const parsed = adCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { title, description, price, category_id, city_name, package_id, media_urls } = parsed.data;

    // 1. Verify category, package all exist and are active using Supabase
    const [{ data: category }, { data: pkg }] = await Promise.all([
      supabaseAdmin.from('categories').select('id').eq('id', category_id).eq('is_active', true).maybeSingle(),
      supabaseAdmin.from('packages').select('id').eq('id', package_id).eq('is_active', true).maybeSingle(),
    ]);

    if (!category) return errorResponse('Invalid or inactive category', 422);
    if (!pkg)      return errorResponse('Invalid or inactive package', 422);

    // 2. Handle City (Auto-create if doesn't exist)
    let final_city_id: string;
    const { data: existingCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .ilike('name', city_name)
      .maybeSingle();

    if (existingCity) {
      final_city_id = existingCity.id;
    } else {
      const citySlug = generateUniqueSlug(city_name);
      const { data: newCity, error: cityError } = await supabaseAdmin
        .from('cities')
        .insert({ name: city_name, slug: citySlug })
        .select('id')
        .single();
      
      if (cityError) throw cityError;
      final_city_id = newCity.id;
    }

    // 3. Generate unique slug
    const slug = generateUniqueSlug(title);

    // 4. Insert the ad (status defaults to 'draft')
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .insert({
        user_id: actor.id,
        package_id,
        category_id,
        city_id: final_city_id,
        title,
        slug,
        description,
        price: price ?? null
      })
      .select('*')
      .single();

    if (adError) throw adError;

    // 4. Normalize and insert media URLs
    const normalizedMedia = normalizeMediaUrls(media_urls);
    const mediaToInsert = normalizedMedia.map((m, index) => ({
      ad_id: ad.id,
      source_type: m.source_type,
      original_url: m.original_url,
      normalized_thumbnail_url: m.normalized_thumbnail_url,
      validation_status: m.validation_status,
      display_order: index
    }));

    if (mediaToInsert.length > 0) {
      const { error: mediaError } = await supabaseAdmin
        .from('ad_media')
        .insert(mediaToInsert);
      if (mediaError) throw mediaError;
    }

    // 5. Log creation to audit_logs
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: actor.id,
        action_type: 'ad_created',
        target_type: 'ad',
        target_id: ad.id,
        new_value: { title, status: 'draft' }
      });

    return successResponse({ message: 'Ad created as draft', ad }, 201);
  } catch (error: any) {
    console.error('Ad creation error:', error);
    return handleAuthError(error);
  }
}

// ============================================
// GET /api/ads — List current user's own ads
// ============================================
export async function GET(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const { data: ads, error } = await supabaseAdmin
      .from('ads')
      .select(`
        id, title, slug, status, price, is_featured, created_at, updated_at,
        categories ( name ),
        cities ( name ),
        packages ( name )
      `)
      .eq('user_id', actor.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten relations to match previous structure
    const flattenedAds = ads.map(ad => ({
      ...ad,
      category_name: (Array.isArray(ad.categories) ? ad.categories[0] : ad.categories)?.name,
      city_name:     (Array.isArray(ad.cities) ? ad.cities[0] : ad.cities)?.name,
      package_name:  (Array.isArray(ad.packages) ? ad.packages[0] : ad.packages)?.name,
      categories: undefined,
      cities:     undefined,
      packages:   undefined
    }));

    return successResponse({ ads: flattenedAds, total: flattenedAds.length });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
