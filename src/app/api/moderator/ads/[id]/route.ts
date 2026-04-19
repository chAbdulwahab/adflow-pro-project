import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { reviewSchema } from '@/lib/validators';
import { transitionAdStatus } from '@/lib/status-machine';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/moderator/ads/[id] — View a single ad in detail
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(req, 'moderator', 'admin', 'super_admin');
    const { id: adId } = await params;

    const [adResult, mediaResult, historyResult] = await Promise.all([
      db.query(
        `SELECT
           a.*,
           u.name  AS owner_name,
           u.email AS owner_email,
           c.name  AS category_name,
           ct.name AS city_name,
           p.name  AS package_name,
           p.price AS package_price,
           sp.display_name AS seller_display_name,
           sp.is_verified  AS seller_verified
         FROM ads a
         JOIN users u          ON a.user_id    = u.id
         LEFT JOIN categories c  ON a.category_id = c.id
         LEFT JOIN cities ct     ON a.city_id     = ct.id
         LEFT JOIN packages p    ON a.package_id  = p.id
         LEFT JOIN seller_profiles sp ON sp.user_id = u.id
         WHERE a.id = $1`,
        [adId]
      ),
      db.query(
        'SELECT * FROM ad_media WHERE ad_id = $1 ORDER BY display_order',
        [adId]
      ),
      db.query(
        `SELECT ash.*, u.name AS changed_by_name
         FROM ad_status_history ash
         LEFT JOIN users u ON ash.changed_by = u.id
         WHERE ash.ad_id = $1
         ORDER BY ash.changed_at DESC`,
        [adId]
      ),
    ]);

    if (adResult.rows.length === 0) {
      return errorResponse('Ad not found', 404);
    }

    return successResponse({
      ad: adResult.rows[0],
      media: mediaResult.rows,
      history: historyResult.rows,
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

// ============================================
// POST /api/moderator/ads/[id]/review — Step 12: Approve or Reject
// approve → submitted → under_review → payment_pending
// reject  → rejected (with rejection_reason)
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireRole(req, 'moderator', 'admin', 'super_admin');
    const { id: adId } = await params;

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { action, rejection_reason } = parsed.data;

    // Validate rejection requires a reason
    if (action === 'reject' && !rejection_reason) {
      return errorResponse('rejection_reason is required when rejecting an ad', 400);
    }

    // 1. Fetch current ad
    const adResult = await db.query(
      'SELECT id, status, user_id FROM ads WHERE id = $1',
      [adId]
    );

    if (adResult.rows.length === 0) {
      return errorResponse('Ad not found', 404);
    }

    const ad = adResult.rows[0];

    // 2. Ad must be in 'submitted' or 'under_review' to be reviewed
    if (!['submitted', 'under_review'].includes(ad.status)) {
      return errorResponse(
        `Cannot review an ad in '${ad.status}' status. Must be 'submitted' or 'under_review'.`,
        422
      );
    }

    const ip = req.headers.get('x-forwarded-for') ?? undefined;

    if (action === 'approve') {
      // Two-step approve: submitted → under_review → payment_pending
      // If already under_review, skip first step
      if (ad.status === 'submitted') {
        await transitionAdStatus({
          adId,
          newStatus: 'under_review',
          actorId: actor.id,
          note: 'Moderator started review',
          ipAddress: ip,
        });
      }

      await transitionAdStatus({
        adId,
        newStatus: 'payment_pending',
        actorId: actor.id,
        note: 'Moderator approved — awaiting payment',
        ipAddress: ip,
      });

      // Notify the ad owner
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, 'ad_approved', $4)`,
        [
          ad.user_id,
          'Your ad has been approved!',
          'Your ad passed moderation. Please proceed with payment to publish it.',
          `/ads/${adId}/payment`,
        ]
      );

      return successResponse({
        message: 'Ad approved — status set to payment_pending',
        adId,
      });
    }

    // action === 'reject'
    // First save the rejection reason on the ad
    await db.query(
      'UPDATE ads SET rejection_reason = $1, updated_at = NOW() WHERE id = $2',
      [rejection_reason, adId]
    );

    await transitionAdStatus({
      adId,
      newStatus: 'rejected',
      actorId: actor.id,
      note: `Rejected: ${rejection_reason}`,
      ipAddress: ip,
    });

    // Notify owner
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, 'ad_rejected', $4)`,
      [
        ad.user_id,
        'Your ad was rejected',
        `Reason: ${rejection_reason}. You can edit and resubmit your ad.`,
        `/ads/${adId}`,
      ]
    );

    return successResponse({
      message: 'Ad rejected',
      adId,
      rejection_reason,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Invalid transition') || error.message?.startsWith('Ad not found')) {
      return errorResponse(error.message, 422);
    }
    return handleAuthError(error);
  }
}
