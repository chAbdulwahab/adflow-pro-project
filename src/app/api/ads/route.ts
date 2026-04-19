import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    // 1. Verify category, package all exist and are active
    const [catCheck, pkgCheck] = await Promise.all([
      db.query('SELECT id FROM categories WHERE id = $1 AND is_active = true', [category_id]),
      db.query('SELECT id FROM packages WHERE id = $1 AND is_active = true', [package_id]),
    ]);

    if (catCheck.rows.length === 0)  return errorResponse('Invalid or inactive category', 422);
    if (pkgCheck.rows.length === 0)  return errorResponse('Invalid or inactive package', 422);

    // 2. Handle City (Auto-create if doesn't exist)
    let final_city_id: string;
    const cityCheck = await db.query('SELECT id FROM cities WHERE name ILIKE $1', [city_name]);
    if (cityCheck.rows.length > 0) {
      final_city_id = cityCheck.rows[0].id;
    } else {
      const citySlug = generateUniqueSlug(city_name);
      const newCity = await db.query(
        'INSERT INTO cities (name, slug) VALUES ($1, $2) RETURNING id',
        [city_name, citySlug]
      );
      final_city_id = newCity.rows[0].id;
    }

    // 3. Generate unique slug
    const slug = generateUniqueSlug(title);

    // 4. Insert the ad (status defaults to 'draft')
    const adResult = await db.query(
      `INSERT INTO ads (user_id, package_id, category_id, city_id, title, slug, description, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [actor.id, package_id, category_id, final_city_id, title, slug, description, price ?? null]
    );
    const ad = adResult.rows[0];

    // 4. Normalize and insert media URLs
    const normalizedMedia = normalizeMediaUrls(media_urls);
    const mediaInserts = normalizedMedia.map((m, index) =>
      db.query(
        `INSERT INTO ad_media (ad_id, source_type, original_url, normalized_thumbnail_url, validation_status, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ad.id, m.source_type, m.original_url, m.normalized_thumbnail_url, m.validation_status, index]
      )
    );
    await Promise.all(mediaInserts);

    // 5. Log creation to audit_logs
    await db.query(
      `INSERT INTO audit_logs (actor_id, action_type, target_type, target_id, new_value)
       VALUES ($1, 'ad_created', 'ad', $2, $3)`,
      [actor.id, ad.id, JSON.stringify({ title, status: 'draft' })]
    );

    return successResponse({ message: 'Ad created as draft', ad }, 201);
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// ============================================
// GET /api/ads — List current user's own ads
// ============================================
export async function GET(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const result = await db.query(
      `SELECT a.id, a.title, a.slug, a.status, a.price, a.is_featured,
              a.created_at, a.updated_at,
              c.name AS category_name, ct.name AS city_name, p.name AS package_name
       FROM ads a
       LEFT JOIN categories c  ON a.category_id = c.id
       LEFT JOIN cities ct     ON a.city_id = ct.id
       LEFT JOIN packages p    ON a.package_id = p.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [actor.id]
    );

    return successResponse({ ads: result.rows, total: result.rows.length });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
