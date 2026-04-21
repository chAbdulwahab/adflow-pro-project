import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { transitionAdStatus, isTransitionAllowed, getAllowedTransitions } from '@/lib/status-machine';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';
import type { AdStatus } from '@/constants';

// ... (GET logic remains same as it only uses helpers)

// --- LIVE EXECUTION (POST) ---
export async function POST(req: NextRequest) {
  try {
    const actor = requireRole(req, 'admin', 'super_admin');

    const { adId, newStatus, note } = await req.json();

    if (!adId || !newStatus) {
      return errorResponse('adId and newStatus are required', 400);
    }

    const ip = req.headers.get('x-forwarded-for') ?? undefined;

    const result = await transitionAdStatus({
      adId,
      newStatus,
      actorId: actor.id,
      note,
      ipAddress: ip,
    });

    // Return current status history for this ad using Supabase
    const { data: history, error: historyError } = await supabaseAdmin
      .from('ad_status_history')
      .select('previous_status, new_status, note, changed_at')
      .eq('ad_id', adId)
      .order('changed_at', { ascending: false })
      .limit(10);
    
    if (historyError) throw historyError;

    return successResponse({
      message: `✅ Ad transitioned: '${result.previousStatus}' → '${result.newStatus}'`,
      transition: result,
      history: history || [],
    });
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition') || error.message?.startsWith('Ad not found')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}
