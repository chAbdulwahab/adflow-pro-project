import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    // 2. Verify ad belongs to this user and is payment_pending
    const adResult = await db.query(
      'SELECT id, status, user_id, package_id FROM ads WHERE id = $1',
      [adId]
    );

    if (adResult.rows.length === 0) return errorResponse('Ad not found', 404);

    const ad = adResult.rows[0];

    if (ad.user_id !== actor.id) return errorResponse('You do not own this ad', 403);

    if (ad.status !== 'payment_pending') {
      return errorResponse(
        `Ad is in '${ad.status}' status. Payment can only be submitted when status is 'payment_pending'.`,
        422
      );
    }

    // 3. Block duplicate transaction references
    const dupCheck = await db.query(
      'SELECT id FROM payments WHERE transaction_ref = $1',
      [transaction_ref]
    );
    if (dupCheck.rows.length > 0) {
      return errorResponse('This transaction reference has already been used', 409);
    }

    // 4. Insert payment record
    const paymentResult = await db.query(
      `INSERT INTO payments (ad_id, amount, method, transaction_ref, sender_name, screenshot_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [adId, amount, method, transaction_ref, sender_name, screenshot_url ?? null]
    );
    const payment = paymentResult.rows[0];

    // 5. Transition ad status: payment_pending → payment_submitted
    await transitionAdStatus({
      adId,
      newStatus: 'payment_submitted',
      actorId: actor.id,
      note: `Payment submitted via ${method} — ref: ${transaction_ref}`,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    // 6. Notify the user
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'payment_submitted', $4)`,
      [
        actor.id,
        'Payment submitted for verification',
        `Your payment of PKR ${amount} via ${method} is under review. Reference: ${transaction_ref}`,
        `/ads/${adId}`,
      ]
    );

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

    const adCheck = await db.query(
      'SELECT id, user_id FROM ads WHERE id = $1',
      [adId]
    );
    if (adCheck.rows.length === 0) return errorResponse('Ad not found', 404);
    if (adCheck.rows[0].user_id !== actor.id) return errorResponse('Forbidden', 403);

    const result = await db.query(
      'SELECT * FROM payments WHERE ad_id = $1 ORDER BY created_at DESC',
      [adId]
    );

    return successResponse({ payments: result.rows });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
