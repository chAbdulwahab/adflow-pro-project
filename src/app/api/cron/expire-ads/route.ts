import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function handler(req: Request) {
  // Support both custom header and Vercel's standard Authorization header
  const authHeader = req.headers.get('Authorization');
  const customSecret = req.headers.get('x-cron-secret');
  
  const isValid = 
    (customSecret === process.env.JWT_SECRET) || 
    (authHeader === `Bearer ${process.env.CRON_SECRET}`);

  if (!isValid && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const now = new Date().toISOString();

  const { data: toExpire, error } = await supabaseAdmin
    .from('ads')
    .select('id, title, user_id')
    .eq('status', 'published')
    .lt('expire_at', now);

  if (error) return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });

  let expired = 0;
  for (const ad of toExpire || []) {
    await supabaseAdmin
      .from('ads')
      .update({ status: 'expired', is_visible_publicly: false, updated_at: now })
      .eq('id', ad.id);

    await supabaseAdmin.from('notifications').insert({
      user_id: ad.user_id,
      title: '⏰ Ad Expired',
      message: `Your ad "${ad.title}" has expired and is no longer visible.`,
      type: 'status_update',
      related_ad_id: ad.id,
      link: '/client/dashboard',
    });
    expired++;
  }

  await supabaseAdmin.from('system_health_logs').insert({
    source: 'cron:expire',
    status: 'success',
    response_ms: Date.now() - start,
    metadata: { ads_expired: expired },
  });

  return NextResponse.json({ status: 'success', ads_expired: expired, duration_ms: Date.now() - start });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
