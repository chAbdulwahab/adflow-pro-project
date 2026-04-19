import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

// ============================================
// GET /api/public/meta — Step 20: Dropdown data for browse filters
// Returns active categories, cities, and packages in one request.
// NO auth required. Cached at the edge for performance.
// ============================================
export async function GET(_req: NextRequest) {
  try {
    const [categoriesResult, citiesResult, packagesResult, statsResult] = await Promise.all([
      db.query(
        `SELECT id, name, slug,
           (SELECT COUNT(*) FROM ads
            WHERE category_id = categories.id
              AND status = 'published'
              AND expire_at > NOW()) AS ad_count
         FROM categories
         WHERE is_active = true
         ORDER BY name`
      ),
      db.query(
        `SELECT id, name, slug,
           (SELECT COUNT(*) FROM ads
            WHERE city_id = cities.id
              AND status = 'published'
              AND expire_at > NOW()) AS ad_count
         FROM cities
         WHERE is_active = true
         ORDER BY name`
      ),
      db.query(
        `SELECT id, name, duration_days, price, is_featured, description
         FROM packages
         WHERE is_active = true
         ORDER BY price`
      ),
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'published' AND expire_at > NOW()) AS live_ads,
           COUNT(*) FILTER (WHERE status = 'published' AND expire_at > NOW() AND is_featured = true) AS featured_ads,
           COUNT(DISTINCT city_id) FILTER (WHERE status = 'published' AND expire_at > NOW()) AS active_cities
         FROM ads`
      ),
    ]);

    return successResponse({
      categories: categoriesResult.rows,
      cities:     citiesResult.rows,
      packages:   packagesResult.rows,
      stats: {
        live_ads:     parseInt(statsResult.rows[0].live_ads),
        featured_ads: parseInt(statsResult.rows[0].featured_ads),
        active_cities: parseInt(statsResult.rows[0].active_cities),
      },
    });
  } catch (error: any) {
    console.error('Meta error:', error);
    return errorResponse(error.message || 'Failed to fetch metadata', 500);
  }
}
