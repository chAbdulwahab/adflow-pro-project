import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    // 1. Fetch the ad (enforce public visibility rules)
    const adResult = await db.query(
      `SELECT
         a.id, a.title, a.slug, a.description, a.price,
         a.is_featured, a.rank_score, a.publish_at, a.expire_at, a.created_at,
         c.name  AS category_name,
         c.slug  AS category_slug,
         ct.name AS city_name,
         ct.slug AS city_slug,
         p.name  AS package_name,
         u.name  AS owner_name,
         sp.display_name  AS seller_display_name,
         sp.business_name AS seller_business_name,
         sp.phone         AS seller_phone,
         sp.city          AS seller_city,
         sp.is_verified   AS seller_verified
       FROM ads a
       JOIN users u          ON a.user_id    = u.id
       LEFT JOIN categories c  ON a.category_id = c.id
       LEFT JOIN cities ct     ON a.city_id     = ct.id
       LEFT JOIN packages p    ON a.package_id  = p.id
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE a.slug = $1
         AND a.status = 'published'
         AND a.expire_at > NOW()`,
      [slug]
    );

    if (adResult.rows.length === 0) {
      return errorResponse('Ad not found or no longer available', 404);
    }

    const ad = adResult.rows[0];

    // 2. Fetch all valid media for this ad
    const mediaResult = await db.query(
      `SELECT source_type, original_url, normalized_thumbnail_url, display_order
       FROM ad_media
       WHERE ad_id = $1 AND validation_status = 'valid'
       ORDER BY display_order`,
      [ad.id]
    );

    // 3. Fetch related ads (same category, excluding this one, limit 4)
    const relatedResult = await db.query(
      `SELECT
         a.id, a.title, a.slug, a.price, a.is_featured,
         ct.name AS city_name,
         (SELECT normalized_thumbnail_url FROM ad_media
          WHERE ad_id = a.id AND validation_status = 'valid'
          ORDER BY display_order LIMIT 1) AS thumbnail
       FROM ads a
       LEFT JOIN cities ct ON a.city_id = ct.id
       WHERE a.status = 'published'
         AND a.expire_at > NOW()
         AND a.category_id = (SELECT category_id FROM ads WHERE slug = $1)
         AND a.slug != $1
       ORDER BY a.rank_score DESC
       LIMIT 4`,
      [slug]
    );

    return successResponse({
      ad: {
        ...ad,
        media: mediaResult.rows,
      },
      related_ads: relatedResult.rows,
    });
  } catch (error: any) {
    console.error('Ad detail error:', error);
    return errorResponse(error.message || 'Failed to fetch ad', 500);
  }
}
