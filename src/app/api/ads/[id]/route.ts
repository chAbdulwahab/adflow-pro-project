import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { adCreateSchema } from '@/lib/validators';
import { normalizeMediaUrls } from '@/lib/media';
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

    const adResult = await db.query(
      `SELECT
         a.id, a.title, a.slug, a.description, a.price,
         a.status, a.is_featured, a.created_at, a.updated_at,
         a.category_id, a.city_id, a.package_id,
         c.name  AS category_name,
         ct.name AS city_name,
         p.name  AS package_name
       FROM ads a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN cities ct    ON a.city_id = ct.id
       LEFT JOIN packages p   ON a.package_id = p.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [adId, actor.id]
    );

    if (adResult.rows.length === 0) {
      return errorResponse('Ad not found or access denied', 404);
    }

    const ad = adResult.rows[0];

    // Fetch associated media
    const mediaResult = await db.query(
      `SELECT id, source_type, original_url, normalized_thumbnail_url, validation_status, display_order
       FROM ad_media
       WHERE ad_id = $1
       ORDER BY display_order`,
      [adId]
    );

    return successResponse({ ad: { ...ad, media: mediaResult.rows } });
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
    const adCheck = await db.query(
      'SELECT id, status, user_id FROM ads WHERE id = $1',
      [adId]
    );

    if (adCheck.rows.length === 0) return errorResponse('Ad not found', 404);

    const ad = adCheck.rows[0];

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
    const [catCheck, pkgCheck] = await Promise.all([
      db.query('SELECT id FROM categories WHERE id = $1 AND is_active = true', [category_id]),
      db.query('SELECT id FROM packages WHERE id = $1 AND is_active = true', [package_id]),
    ]);

    if (catCheck.rows.length === 0)  return errorResponse('Invalid or inactive category', 422);
    if (pkgCheck.rows.length === 0)  return errorResponse('Invalid or inactive package', 422);

    // 3b. Handle City (Auto-create if doesn't exist)
    let final_city_id: string;
    const cityCheck = await db.query('SELECT id FROM cities WHERE name ILIKE $1', [city_name]);
    if (cityCheck.rows.length > 0) {
      final_city_id = cityCheck.rows[0].id;
    } else {
      const { generateUniqueSlug } = await import('@/lib/slug');
      const citySlug = generateUniqueSlug(city_name);
      const newCity = await db.query(
        'INSERT INTO cities (name, slug) VALUES ($1, $2) RETURNING id',
        [city_name, citySlug]
      );
      final_city_id = newCity.rows[0].id;
    }

    // 4. Update the ad (keep same slug, reset to draft if was rejected)
    const newStatus = ad.status === 'rejected' ? 'draft' : ad.status;

    await db.query(
      `UPDATE ads
       SET title = $1, description = $2, price = $3,
           category_id = $4, city_id = $5, package_id = $6,
           status = $7, updated_at = NOW()
       WHERE id = $8`,
      [title, description, price ?? null, category_id, final_city_id, package_id, newStatus, adId]
    );

    // 5. Replace media: delete old, insert new
    await db.query('DELETE FROM ad_media WHERE ad_id = $1', [adId]);

    const normalizedMedia = normalizeMediaUrls(media_urls);
    const mediaInserts = normalizedMedia.map((m, index) =>
      db.query(
        `INSERT INTO ad_media (ad_id, source_type, original_url, normalized_thumbnail_url, validation_status, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [adId, m.source_type, m.original_url, m.normalized_thumbnail_url, m.validation_status, index]
      )
    );
    await Promise.all(mediaInserts);

    // 6. Log to audit
    await db.query(
      `INSERT INTO audit_logs (actor_id, action_type, target_type, target_id, new_value)
       VALUES ($1, 'ad_updated', 'ad', $2, $3)`,
      [actor.id, adId, JSON.stringify({ title, status: newStatus })]
    );

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
    const adCheck = await db.query('SELECT user_id, title FROM ads WHERE id = $1', [adId]);
    if (adCheck.rows.length === 0) return errorResponse('Ad not found', 404);

    const ad = adCheck.rows[0];

    // 2. Enforce Role-Based Access Control
    if (ad.user_id !== actor.id && actor.role === 'client') {
      return errorResponse('You are not authorized to delete this ad', 403);
    }

    // 3. Perform a clean cascade deletion to avoid constraints
    await db.query('BEGIN');
    
    // Delete dependencies first (doing this manually in case DB lacks CASCADE rules)
    await db.query('DELETE FROM ad_media WHERE ad_id = $1', [adId]);
    await db.query('DELETE FROM ad_status_history WHERE ad_id = $1', [adId]);
    await db.query('DELETE FROM payments WHERE ad_id = $1', [adId]);
    await db.query('DELETE FROM audit_logs WHERE target_type = $1 AND target_id = $2', ['ad', adId]);
    
    // Finally, delete the ad itself
    await db.query('DELETE FROM ads WHERE id = $1', [adId]);
    
    // Log the deletion (target_id is dead, but we log the actor's action)
    await db.query(
      `INSERT INTO audit_logs (actor_id, action_type, target_type, target_id, new_value)
       VALUES ($1, 'ad_deleted', 'ad', $2, $3)`,
      [actor.id, adId, JSON.stringify({ deleted_title: ad.title })]
    );

    await db.query('COMMIT');

    return successResponse({ message: 'Ad deleted successfully' });
  } catch (error: any) {
    await db.query('ROLLBACK');
    return handleAuthError(error);
  }
}
