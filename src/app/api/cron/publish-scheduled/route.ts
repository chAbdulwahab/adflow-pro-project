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

  const { data: scheduled, error } = await supabaseAdmin
    .from('ads')
    .select('id, title, user_id, package:packages(duration_days)')
    .eq('status', 'scheduled')
    .lte('publish_at', now);

  if (error) {
    await supabaseAdmin.from('system_health_logs').insert({
      source: 'cron:publish',
      status: 'error',
      error_message: error.message,
      response_ms: Date.now() - start,
    });
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }

  let published = 0;
  let failed = 0;

  for (const ad of scheduled || []) {
    try {
      const publishDate = new Date();
      const durationDays = (ad.package as { duration_days?: number })?.duration_days ?? 7;
      const expireDate = new Date(publishDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from('ads')
        .update({
          status: 'published',
          is_visible_publicly: true,
          published_at: publishDate.toISOString(),
          expire_at: expireDate.toISOString(),
          updated_at: publishDate.toISOString(),
        })
        .eq('id', ad.id);

      await supabaseAdmin.from('notifications').insert({
        user_id: ad.user_id,
        title: '🎉 Ad Published!',
        message: `Your ad "${ad.title}" is now live!`,
        type: 'status_update',
        related_ad_id: ad.id,
        link: '/client/dashboard',
      });

      published++;
    } catch {
      failed++;
    }
  }

  const duration = Date.now() - start;
  await supabaseAdmin.from('system_health_logs').insert({
    source: 'cron:publish',
    status: 'success',
    response_ms: duration,
    metadata: { ads_published: published, ads_failed: failed },
  });

  return NextResponse.json({ status: 'success', ads_published: published, ads_failed: failed, duration_ms: duration });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
