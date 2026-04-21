import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { adCreateSchema } from '@/lib/validators';
import { normalizeMediaUrls } from '@/lib/media';
import { generateUniqueSlug } from '@/lib/slug';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/ads/[id] — Fetch single ad (owner only)
// Returns full ad + media for the edit form
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: adId } = await params;

    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select(`
        id, title, slug, description, price,
        status, is_featured, created_at, updated_at,
        category_id, city_id, package_id,
        categories ( name ),
        cities ( name ),
        packages ( name )
      `)
      .eq('id', adId)
      .eq('user_id', actor.id)
      .maybeSingle();

    if (adError) throw adError;
    if (!ad) {
      return errorResponse('Ad not found or access denied', 404);
    }

    // Fetch associated media
    const { data: media, error: mediaError } = await supabaseAdmin
      .from('ad_media')
      .select('id, source_type, original_url, normalized_thumbnail_url, validation_status, display_order')
      .eq('ad_id', adId)
      .order('display_order', { ascending: true });
    
    if (mediaError) throw mediaError;

    // Flatten names
    const cat = Array.isArray(ad.categories) ? ad.categories[0] : ad.categories;
    const cit = Array.isArray(ad.cities) ? ad.cities[0] : ad.cities;
    const pkg = Array.isArray(ad.packages) ? ad.packages[0] : ad.packages;

    const processedAd = {
       ...ad,
       category_name: cat?.name,
       city_name: cit?.name,
       package_name: pkg?.name,
       categories: undefined,
       cities: undefined,
       packages: undefined,
       media: media || []
    };

    return successResponse({ ad: processedAd });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// ============================================
// PUT /api/ads/[id] — Update a draft ad (owner only)
// Only allowed when status = 'draft' or 'rejected'
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: adId } = await params;

    // 1. Check ownership + editable status
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select('id, status, user_id')
      .eq('id', adId)
      .maybeSingle();

    if (adError) throw adError;
    if (!ad) return errorResponse('Ad not found', 404);
    if (ad.user_id !== actor.id) return errorResponse('You do not own this ad', 403);

    const editableStatuses = ['draft', 'rejected'];
    if (!editableStatuses.includes(ad.status)) {
      return errorResponse(
        `Ad cannot be edited in '${ad.status}' status. Only draft or rejected ads can be edited.`,
        422
      );
    }

    // 2. Validate input
    const body = await req.json();
    const parsed = adCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { title, description, price, category_id, city_name, package_id, media_urls } = parsed.data;

    // 3. Verify active references
    const [catRes, pkgRes] = await Promise.all([
      supabaseAdmin.from('categories').select('id').eq('id', category_id).eq('is_active', true).maybeSingle(),
      supabaseAdmin.from('packages').select('id').eq('id', package_id).eq('is_active', true).maybeSingle()
    ]);

    if (!catRes.data) return errorResponse('Invalid or inactive category', 422);
    if (!pkgRes.data) return errorResponse('Invalid or inactive package', 422);

    // 3b. Handle City
    let final_city_id: string;
    const { data: cityCheck } = await supabaseAdmin
      .from('cities')
      .select('id')
      .ilike('name', city_name)
      .maybeSingle();

    if (cityCheck) {
      final_city_id = cityCheck.id;
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

    // 4. Update the ad
    const newStatus = ad.status === 'rejected' ? 'draft' : ad.status;

    const { error: updateError } = await supabaseAdmin
      .from('ads')
      .update({
        title,
        description,
        price: price ?? null,
        category_id,
        city_id: final_city_id,
        package_id,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', adId);
    
    if (updateError) throw updateError;

    // 5. Replace media
    const { error: deleteMediaError } = await supabaseAdmin
      .from('ad_media')
      .delete()
      .eq('ad_id', adId);
    
    if (deleteMediaError) throw deleteMediaError;

    const normalizedMedia = normalizeMediaUrls(media_urls);
    const mediaToInsert = normalizedMedia.map((m, index) => ({
      ad_id: adId,
      source_type: m.source_type,
      original_url: m.original_url,
      normalized_thumbnail_url: m.normalized_thumbnail_url,
      validation_status: m.validation_status,
      display_order: index
    }));

    const { error: insertMediaError } = await supabaseAdmin
      .from('ad_media')
      .insert(mediaToInsert);
    
    if (insertMediaError) throw insertMediaError;

    // 6. Log to audit
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: actor.id,
        action_type: 'ad_updated',
        target_type: 'ad',
        target_id: adId,
        new_value: { title, status: newStatus }
      });

    return successResponse({ message: 'Ad updated successfully', adId, status: newStatus });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// ============================================
// DELETE /api/ads/[id] — Delete an ad
// Owners can delete their own ads, Admins/Moderators can delete any ad.
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: adId } = await params;

    // 1. Check ownership & existence
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select('user_id, title')
      .eq('id', adId)
      .maybeSingle();

    if (adError) throw adError;
    if (!ad) return errorResponse('Ad not found', 404);

    // 2. Enforce Role-Based Access Control
    if (ad.user_id !== actor.id && actor.role === 'client') {
      return errorResponse('You are not authorized to delete this ad', 403);
    }

    // 3. Perform a clean deletion
    // Delete dependencies
    await supabaseAdmin.from('ad_media').delete().eq('ad_id', adId);
    await supabaseAdmin.from('ad_status_history').delete().eq('ad_id', adId);
    await supabaseAdmin.from('payments').delete().eq('ad_id', adId);
    await supabaseAdmin.from('audit_logs').delete().eq('target_type', 'ad').eq('target_id', adId);
    
    // Finally, delete the ad itself
    const { error: deleteAdError } = await supabaseAdmin.from('ads').delete().eq('id', adId);
    if (deleteAdError) throw deleteAdError;
    
    // Log the deletion
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: actor.id,
        action_type: 'ad_deleted',
        target_type: 'ad',
        target_id: adId,
        new_value: { deleted_title: ad.title }
      });

    return successResponse({ message: 'Ad deleted successfully' });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
