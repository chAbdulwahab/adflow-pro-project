import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { successResponse, handleAuthError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    // 1. Get IDs of all conversations the actor is part of
    const { data: convs, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${actor.id},seller_id.eq.${actor.id}`);
    
    if (convError) throw convError;

    const convIds = (convs || []).map(c => c.id);

    if (convIds.length === 0) {
      return successResponse({ count: 0 });
    }

    // 2. Count unread messages in those conversations sent by others
    const { count, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', actor.id)
      .in('conversation_id', convIds);

    if (msgError) throw msgError;

    return successResponse({ count: count || 0 });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
