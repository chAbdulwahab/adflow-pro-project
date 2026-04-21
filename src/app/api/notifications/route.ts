import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    let query = supabaseAdmin
      .from('notifications')
      .select('id, title, message, type, is_read, link, created_at', { count: 'exact' })
      .eq('user_id', actor.id)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    // Separate count for total unread
    const { count: unreadCount, error: unreadError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', actor.id)
      .eq('is_read', false);

    if (unreadError) throw unreadError;

    const total = count || 0;

    return successResponse({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
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

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', actor.id)
      .eq('is_read', false)
      .select('id');

    if (error) throw error;

    const updatedCount = data?.length || 0;

    return successResponse({
      message: `Marked ${updatedCount} notifications as read`,
      updated: updatedCount,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
