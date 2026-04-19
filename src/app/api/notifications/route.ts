import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/notifications — Step 21: List authenticated user's notifications
// Query params:
//   unread_only=true  — only return unread notifications
//   page, limit
// ============================================
export async function GET(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    const conditions = ['user_id = $1'];
    const values: (string | number)[] = [actor.id];
    let idx = 2;

    if (unreadOnly) {
      conditions.push('is_read = false');
    }

    const whereClause = conditions.join(' AND ');

    const [notifResult, countResult, unreadCountResult] = await Promise.all([
      db.query(
        `SELECT id, title, message, type, is_read, link, created_at
         FROM notifications
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM notifications WHERE ${whereClause}`,
        values
      ),
      db.query(
        'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = $1 AND is_read = false',
        [actor.id]
      ),
    ]);

    const total  = parseInt(countResult.rows[0].total);
    const unread = parseInt(unreadCountResult.rows[0].unread);

    return successResponse({
      notifications: notifResult.rows,
      unread_count: unread,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// ============================================
// PATCH /api/notifications — Mark ALL notifications as read
// ============================================
export async function PATCH(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const result = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [actor.id]
    );

    return successResponse({
      message: `Marked ${result.rowCount} notifications as read`,
      updated: result.rowCount,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
