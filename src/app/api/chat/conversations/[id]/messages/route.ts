import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: conversationId } = await params;

    // 1. Verify access
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError) throw convError;
    if (!conversation) return errorResponse('Conversation not found', 404);
    if (conversation.buyer_id !== actor.id && conversation.seller_id !== actor.id) {
      return errorResponse('Access denied', 403);
    }

    // 2. Fetch messages
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 3. Mark messages as read (messages sent by the other person)
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', actor.id)
      .eq('is_read', false);

    return successResponse({ messages });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: conversationId } = await params;
    const { content } = await req.json();

    if (!content) return errorResponse('Message content is required', 400);

    // 1. Verify access
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError) throw convError;
    if (!conversation) return errorResponse('Conversation not found', 404);
    if (conversation.buyer_id !== actor.id && conversation.seller_id !== actor.id) {
      return errorResponse('Access denied', 403);
    }

    // 2. Insert message
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: actor.id,
        content
      })
      .select('*')
      .single();

    if (msgError) throw msgError;

    // 3. Update conversation's updated_at
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return successResponse({ message });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
