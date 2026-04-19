import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { transitionAdStatus } from '@/lib/status-machine';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// POST /api/ads/[id]/submit — Step 10: Client submits draft for review
// Transition: draft → submitted
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireAuth(req);
    const { id: adId } = await params;

    // 1. Verify ad belongs to this user and is a draft
    const adResult = await db.query(
      'SELECT id, status, user_id FROM ads WHERE id = $1',
      [adId]
    );

    if (adResult.rows.length === 0) {
      return errorResponse('Ad not found', 404);
    }

    const ad = adResult.rows[0];

    if (ad.user_id !== actor.id) {
      return errorResponse('You do not own this ad', 403);
    }

    if (ad.status !== 'draft') {
      return errorResponse(`Ad is already in '${ad.status}' status. Only drafts can be submitted.`, 422);
    }

    // 2. Verify the ad has at least one valid media item
    const mediaCheck = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE validation_status = 'valid')   AS valid_count,
         COUNT(*) FILTER (WHERE validation_status = 'invalid') AS invalid_count
       FROM ad_media WHERE ad_id = $1`,
      [adId]
    );

    const validCount   = parseInt(mediaCheck.rows[0].valid_count);
    const invalidCount = parseInt(mediaCheck.rows[0].invalid_count);

    if (validCount === 0) {
      const hint = invalidCount > 0
        ? ` You have ${invalidCount} invalid media item(s) — base64 images (data:...) are not supported. Please edit the ad and replace them with a YouTube link (https://youtube.com/watch?v=...), a Cloudinary URL (https://res.cloudinary.com/...), or a direct image URL ending in .jpg/.png/.webp.`
        : ' Please edit the ad and add at least one media URL (YouTube link, Cloudinary URL, or direct image URL starting with https://).';

      return errorResponse(`Ad must have at least one valid media item before submitting.${hint}`, 422);
    }

    // 3. Execute the transition: draft → submitted
    const result = await transitionAdStatus({
      adId,
      newStatus: 'submitted',
      actorId: actor.id,
      note: 'Client submitted ad for review',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    // 4. Notify the user (optional — insert a notification row)
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'ad_submitted', $4)`,
      [
        actor.id,
        'Ad submitted for review',
        'Your ad has been submitted and is awaiting moderator review.',
        `/ads/${adId}`,
      ]
    );

    return successResponse({
      message: 'Ad submitted for review',
      transition: result,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition') || error.message?.startsWith('Ad not found')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}
