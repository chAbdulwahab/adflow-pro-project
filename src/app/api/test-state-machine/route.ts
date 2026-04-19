import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { transitionAdStatus, isTransitionAllowed, getAllowedTransitions } from '@/lib/status-machine';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';
import type { AdStatus } from '@/constants';

/**
 * GET /api/test-state-machine?adId=<uuid>&from=draft&to=submitted
 * Tests the transition without actually executing it.
 *
 * POST /api/test-state-machine
 * Body: { adId, newStatus }
 * Requires admin or super_admin role.
 * Actually executes the transition on the ad.
 */

// --- DRY RUN (GET) ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') as AdStatus | null;
  const to   = searchParams.get('to')   as AdStatus | null;

  if (!from || !to) {
    return errorResponse('Provide ?from=<status>&to=<status> query params', 400);
  }

  const allowed = isTransitionAllowed(from, to);

  return successResponse({
    from,
    to,
    allowed,
    allowed_from_current: getAllowedTransitions(from),
    message: allowed
      ? `✅ Transition '${from}' → '${to}' is VALID`
      : `❌ Transition '${from}' → '${to}' is INVALID`,
  });
}

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

    // Return current status history for this ad
    const history = await db.query(
      `SELECT previous_status, new_status, note, changed_at
       FROM ad_status_history WHERE ad_id = $1
       ORDER BY changed_at DESC LIMIT 10`,
      [adId]
    );

    return successResponse({
      message: `✅ Ad transitioned: '${result.previousStatus}' → '${result.newStatus}'`,
      transition: result,
      history: history.rows,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition') || error.message?.startsWith('Ad not found')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}
