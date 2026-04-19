import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/admin/payments — Step 14: Admin payment queue
// Lists all payments awaiting verification
// Requires: admin or super_admin
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    const allowedStatuses = ['pending', 'verified', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(`status must be one of: ${allowedStatuses.join(', ')}`, 400);
    }

    const [paymentsResult, countResult] = await Promise.all([
      db.query(
        `SELECT
           p.id, p.amount, p.method, p.transaction_ref, p.sender_name,
           p.screenshot_url, p.status, p.rejection_note, p.created_at,
           p.verified_at,
           a.id         AS ad_id,
           a.title      AS ad_title,
           a.status     AS ad_status,
           pkg.name     AS package_name,
           pkg.price    AS package_price,
           u.name       AS owner_name,
           u.email      AS owner_email,
           verifier.name AS verified_by_name
         FROM payments p
         JOIN ads a      ON p.ad_id     = a.id
         JOIN users u    ON a.user_id   = u.id
         LEFT JOIN packages pkg   ON a.package_id  = pkg.id
         LEFT JOIN users verifier ON p.verified_by = verifier.id
         WHERE p.status = $1
         ORDER BY p.created_at ASC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      ),
      db.query('SELECT COUNT(*) AS total FROM payments WHERE status = $1', [status]),
    ]);

    const total = parseInt(countResult.rows[0].total);

    return successResponse({
      payments: paymentsResult.rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
