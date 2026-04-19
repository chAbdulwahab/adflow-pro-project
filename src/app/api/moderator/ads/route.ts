import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    const [adsResult, countResult] = await Promise.all([
      db.query(
        `SELECT
           a.id, a.title, a.slug, a.status, a.price, a.description,
           a.created_at, a.updated_at,
           u.name  AS owner_name,
           u.email AS owner_email,
           c.name  AS category_name,
           ct.name AS city_name,
           p.name  AS package_name,
           p.price AS package_price,
           sp.is_verified AS seller_verified,
           -- Pull first valid media thumbnail
           (SELECT normalized_thumbnail_url FROM ad_media
            WHERE ad_id = a.id AND validation_status = 'valid'
            ORDER BY display_order LIMIT 1) AS thumbnail
         FROM ads a
         JOIN users u          ON a.user_id    = u.id
         LEFT JOIN categories c  ON a.category_id = c.id
         LEFT JOIN cities ct     ON a.city_id     = ct.id
         LEFT JOIN packages p    ON a.package_id  = p.id
         LEFT JOIN seller_profiles sp ON sp.user_id = u.id
         WHERE a.status = $1
         ORDER BY a.created_at ASC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      ),
      db.query(
        'SELECT COUNT(*) AS total FROM ads WHERE status = $1',
        [status]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);

    return successResponse({
      ads: adsResult.rows,
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
