import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { paymentSubmitSchema } from '@/lib/validators';
import { transitionAdStatus } from '@/lib/status-machine';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// POST /api/ads/[id]/payment — Step 13: Client submits payment proof
// Transition: payment_pending → payment_submitted
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: adId } = await params;

    // 1. Validate input
    const body = await req.json();
    const parsed = paymentSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { amount, method, transaction_ref, sender_name, screenshot_url } = parsed.data;

    // 2. Verify ad belongs to this user and is payment_pending using Supabase
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select('id, status, user_id, package_id')
      .eq('id', adId)
      .maybeSingle();

    if (adError) throw adError;
    if (!ad) return errorResponse('Ad not found', 404);

    if (ad.user_id !== actor.id) return errorResponse('You do not own this ad', 403);

    if (ad.status !== 'payment_pending') {
      return errorResponse(
        `Ad is in '${ad.status}' status. Payment can only be submitted when status is 'payment_pending'.`,
        422
      );
    }

    // 3. Block duplicate transaction references
    const { data: dupCheck, error: dupError } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('transaction_ref', transaction_ref)
      .maybeSingle();
    
    if (dupError && dupError.code !== 'PGRST116') throw dupError; // PGRST116 is no rows returned for maybeSingle

    if (dupCheck) {
      return errorResponse('This transaction reference has already been used', 409);
    }

    // 4. Insert payment record
    const { data: payment, error: pInsertError } = await supabaseAdmin
      .from('payments')
      .insert({
        ad_id: adId,
        amount,
        method,
        transaction_ref,
        sender_name,
        screenshot_url: screenshot_url ?? null
      })
      .select()
      .single();
    
    if (pInsertError) throw pInsertError;

    // 5. Transition ad status: payment_pending → payment_submitted
    await transitionAdStatus({
      adId,
      newStatus: 'payment_submitted',
      actorId: actor.id,
      note: `Payment submitted via ${method} — ref: ${transaction_ref}`,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    // 6. Notify the user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: actor.id,
        title: 'Payment submitted for verification',
        message: `Your payment of PKR ${amount} via ${method} is under review. Reference: ${transaction_ref}`,
        type: 'payment_submitted',
        link: `/ads/${adId}`
      });

    return successResponse({ message: 'Payment submitted for verification', payment }, 201);
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}

// ============================================
// GET /api/ads/[id]/payment — View payment status for an ad
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: adId } = await params;

    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select('id, user_id')
      .eq('id', adId)
      .maybeSingle();

    if (adError) throw adError;
    if (!ad) return errorResponse('Ad not found', 404);
    if (ad.user_id !== actor.id) return errorResponse('Forbidden', 403);

    const { data: payments, error: pError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('ad_id', adId)
      .order('created_at', { ascending: false });
    
    if (pError) throw pError;

    return successResponse({ payments: payments || [] });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
