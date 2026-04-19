import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

// ============================================
// GET /api/public/ads — Step 18: Public browse with filters + pagination
// NO auth required. Only returns published, non-expired ads.
//
// Query params:
//   q           — full-text search (title + description)
//   category    — category slug
//   city        — city slug
//   min_price   — minimum price
//   max_price   — maximum price
//   featured    — 'true' to show only featured ads
//   package     — package name (Basic | Standard | Premium)
//   page        — page number (default: 1)
//   limit       — results per page (default: 20, max: 50)
//   sort        — rank_score|price_asc|price_desc|newest (default: rank_score)
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q        = searchParams.get('q')?.trim() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';
    const city     = searchParams.get('city')?.trim() ?? '';
    const minPrice = parseFloat(searchParams.get('min_price') ?? '0') || 0;
    const maxPrice = parseFloat(searchParams.get('max_price') ?? '0') || 0;
    const featured = searchParams.get('featured') === 'true';
    const pkg      = searchParams.get('package')?.trim() ?? '';
    const sort     = searchParams.get('sort') ?? 'rank_score';
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset   = (page - 1) * limit;

    // Build dynamic WHERE clauses
    const conditions: string[] = [
      "a.status = 'published'",
      'a.expire_at > NOW()',
    ];
    const values: (string | number | boolean)[] = [];
    let idx = 1;

    if (q) {
      conditions.push(`(a.title ILIKE $${idx} OR a.description ILIKE $${idx})`);
      values.push(`%${q}%`);
      idx++;
    }
    if (category) {
      conditions.push(`c.slug = $${idx}`);
      values.push(category);
      idx++;
    }
    if (city) {
      conditions.push(`ct.slug = $${idx}`);
      values.push(city);
      idx++;
    }
    if (minPrice > 0) {
      conditions.push(`a.price >= $${idx}`);
      values.push(minPrice);
      idx++;
    }
    if (maxPrice > 0) {
      conditions.push(`a.price <= $${idx}`);
      values.push(maxPrice);
      idx++;
    }
    if (featured) {
      conditions.push('a.is_featured = true');
    }
    if (pkg) {
      conditions.push(`p.name ILIKE $${idx}`);
      values.push(pkg);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    // Build ORDER BY
    const sortMap: Record<string, string> = {
      rank_score: 'a.rank_score DESC, a.publish_at DESC',
      newest:     'a.publish_at DESC',
      price_asc:  'a.price ASC NULLS LAST',
      price_desc: 'a.price DESC NULLS LAST',
    };
    const orderBy = sortMap[sort] ?? sortMap.rank_score;

    const adsQuery = `
      SELECT
        a.id, a.title, a.slug, a.price, a.is_featured,
        a.rank_score, a.publish_at, a.expire_at, a.created_at,
        c.name  AS category_name,
        c.slug  AS category_slug,
        ct.name AS city_name,
        ct.slug AS city_slug,
        p.name  AS package_name,
        sp.display_name   AS seller_name,
        sp.is_verified    AS seller_verified,
        -- First valid media thumbnail
        (SELECT normalized_thumbnail_url FROM ad_media
         WHERE ad_id = a.id AND validation_status = 'valid'
         ORDER BY display_order LIMIT 1) AS thumbnail
      FROM ads a
      LEFT JOIN categories c    ON a.category_id = c.id
      LEFT JOIN cities ct       ON a.city_id     = ct.id
      LEFT JOIN packages p      ON a.package_id  = p.id
      LEFT JOIN seller_profiles sp ON sp.user_id = a.user_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN cities ct    ON a.city_id     = ct.id
      LEFT JOIN packages p   ON a.package_id  = p.id
      WHERE ${whereClause}
    `;

    const [adsResult, countResult] = await Promise.all([
      db.query(adsQuery, values),
      db.query(countQuery, values.slice(0, -2)), // exclude limit/offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);

    return successResponse({
      ads: adsResult.rows,
      filters: { q, category, city, min_price: minPrice, max_price: maxPrice, featured, sort },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Public browse error:', error);
    return errorResponse(error.message || 'Failed to fetch ads', 500);
  }
}
