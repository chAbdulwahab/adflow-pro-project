import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const actor = requireAuth(req);

    const { data: conversationsResult, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        ad:ad_id ( id, title, slug ),
        buyer:buyer_id ( id, name, email ),
        seller:seller_id ( id, name, email ),
        messages ( id, is_read, sender_id )
      `)
      .or(`buyer_id.eq.${actor.id},seller_id.eq.${actor.id}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const conversations = (conversationsResult || []).map(c => {
      const unreadCount = (c.messages || []).filter((m: any) => !m.is_read && m.sender_id !== actor.id).length;
      return {
        ...c,
        messages: undefined,
        unread_count: unreadCount
      };
    });

    return successResponse({ conversations });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = requireAuth(req);
    const { ad_id, seller_id } = await req.json();

    if (!ad_id || !seller_id) {
      return errorResponse('ad_id and seller_id are required', 400);
    }

    if (actor.id === seller_id) {
      return errorResponse('You cannot chat with yourself', 400);
    }

    // 1. Check if conversation already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('ad_id', ad_id)
      .eq('buyer_id', actor.id)
      .eq('seller_id', seller_id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return successResponse({ conversation: existing });
    }

    // 2. Create new conversation
    const { data: newConv, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        ad_id,
        buyer_id: actor.id,
        seller_id
      })
      .select('id')
      .single();

    if (createError) throw createError;

    return successResponse({ conversation: newConv });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
