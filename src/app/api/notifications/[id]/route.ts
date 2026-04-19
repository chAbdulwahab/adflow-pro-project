import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// PATCH /api/notifications/[id]/read — Mark a single notification as read
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: notifId } = await params;

    // Only allow marking own notifications
    const result = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [notifId, actor.id]
    );

    if (result.rowCount === 0) {
      return errorResponse('Notification not found or access denied', 404);
    }

    return successResponse({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// ============================================
// DELETE /api/notifications/[id]/read — Delete a single notification
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: notifId } = await params;

    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notifId, actor.id]
    );

    if (result.rowCount === 0) {
      return errorResponse('Notification not found or access denied', 404);
    }

    return successResponse({ message: 'Notification deleted' });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
