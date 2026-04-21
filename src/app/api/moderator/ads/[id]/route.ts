import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    const [adRes, mediaRes, historyRes] = await Promise.all([
      supabaseAdmin
        .from('ads')
        .select(`
          *,
          users!user_id ( 
            name, 
            email,
            seller_profiles ( display_name, is_verified )
          ),
          categories ( name ),
          cities ( name ),
          packages ( name, price )
        `)
        .eq('id', adId)
        .maybeSingle(),
      supabaseAdmin
        .from('ad_media')
        .select('*')
        .eq('ad_id', adId)
        .order('display_order', { ascending: true }),
      supabaseAdmin
        .from('ad_status_history')
        .select(`
          *,
          users!changed_by ( name )
        `)
        .eq('ad_id', adId)
        .order('changed_at', { ascending: false })
    ]);

    if (adRes.error) throw adRes.error;
    if (mediaRes.error) throw mediaRes.error;
    if (historyRes.error) throw historyRes.error;

    if (!adRes.data) {
      return errorResponse('Ad not found', 404);
    }

    // Flatten ad data
    const sellerProfile = adRes.data.users?.seller_profiles?.[0];

    const ad = {
      ...adRes.data,
      owner_name: adRes.data.users?.name,
      owner_email: adRes.data.users?.email,
      category_name: adRes.data.categories?.name,
      city_name: adRes.data.cities?.name,
      package_name: adRes.data.packages?.name,
      package_price: adRes.data.packages?.price,
      seller_display_name: sellerProfile?.display_name || adRes.data.users?.name,
      seller_verified: sellerProfile?.is_verified || false,
      users: undefined,
      categories: undefined,
      cities: undefined,
      packages: undefined
    };

    // Flatten history
    const history = (historyRes.data || []).map(h => ({
      ...h,
      changed_by_name: h.users?.name,
      users: undefined
    }));

    return successResponse({
      ad,
      media: mediaRes.data || [],
      history,
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
    const { data: ad, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select('id, status, user_id')
      .eq('id', adId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!ad) {
      return errorResponse('Ad not found', 404);
    }

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
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: ad.user_id,
          title: 'Your ad has been approved!',
          message: 'Your ad passed moderation. Please proceed with payment to publish it.',
          type: 'ad_approved',
          link: `/ads/${adId}/payment`
        });

      if (notifError) throw notifError;

      return successResponse({
        message: 'Ad approved — status set to payment_pending',
        adId,
      });
    }

    // action === 'reject'
    // First save the rejection reason on the ad
    const { error: updateError } = await supabaseAdmin
      .from('ads')
      .update({ rejection_reason, updated_at: new Date().toISOString() })
      .eq('id', adId);

    if (updateError) throw updateError;

    await transitionAdStatus({
      adId,
      newStatus: 'rejected',
      actorId: actor.id,
      note: `Rejected: ${rejection_reason}`,
      ipAddress: ip,
    });

    // Notify owner
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: ad.user_id,
        title: 'Your ad was rejected',
        message: `Reason: ${rejection_reason}. You can edit and resubmit your ad.`,
        type: 'ad_rejected',
        link: `/ads/${adId}`
      });

    if (notifError) throw notifError;

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
