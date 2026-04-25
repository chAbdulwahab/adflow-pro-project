import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

// ============================================
// POST /api/ads/[id]/view
// Records a view impression for an ad.
// No auth required — works for anonymous visitors too.
// Always returns 204.
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;
    console.log('[view] adId received:', adId);
    if (!adId) return new NextResponse(null, { status: 204 });

    const user = getUserFromRequest(req);

    const forwardedFor = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
    const ip = forwardedFor.split(',')[0].trim();
    const ipHash = crypto.createHash('sha256').update(ip + adId).digest('hex').slice(0, 16);

    // Deduplicate: skip if same ip_hash viewed this ad in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from('ad_views')
      .select('id')
      .eq('ad_id', adId)
      .eq('ip_hash', ipHash)
      .gt('viewed_at', oneHourAgo)
      .maybeSingle();

    if (existing) {
      console.log('[view] duplicate — skipped');
    } else {
      const { error: insertError } = await supabaseAdmin.from('ad_views').insert({
        ad_id: adId,
        viewer_id: user?.id ?? null,
        ip_hash: ipHash,
      });
      if (insertError) {
        console.error('[view] insert error:', insertError);
      } else {
        console.log('[view] ✅ view recorded for ad:', adId);
      }
    }
  } catch (err) {
    console.error('[view] unexpected error:', err);
  }

  return new NextResponse(null, { status: 204 });
}
