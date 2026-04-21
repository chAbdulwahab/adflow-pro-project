import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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
    const { data: updated, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)
      .eq('user_id', actor.id)
      .select('id, is_read')
      .maybeSingle();

    if (error) throw error;

    if (!updated) {
      return errorResponse('Notification not found or access denied', 404);
    }

    return successResponse({ message: 'Notification marked as read', notification: updated });
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

    const { data: deleted, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notifId)
      .eq('user_id', actor.id)
      .select('id')
      .maybeSingle();

    if (error) throw error;

    if (!deleted) {
      return errorResponse('Notification not found or access denied', 404);
    }

    return successResponse({ message: 'Notification deleted' });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
