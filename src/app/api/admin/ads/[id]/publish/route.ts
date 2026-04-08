import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['admin', 'super_admin']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const { action, publish_at, is_featured, featured_until } = await req.json();

  const { data: ad } = await supabaseAdmin
    .from('ads')
    .select('*, package:packages(*)')
    .eq('id', id)
    .single();

  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  if (ad.status !== 'payment_verified') {
    return NextResponse.json({ error: 'Ad must have verified payment before publishing' }, { status: 400 });
  }

  const now = new Date();
  const publishDate = action === 'schedule' && publish_at ? new Date(publish_at) : now;
  const durationDays = ad.package?.duration_days ?? 7;
  const expireDate = new Date(publishDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const newStatus = action === 'schedule' ? 'scheduled' : 'published';
  const isPublished = newStatus === 'published';

  // Rank score
  const featuredBonus = is_featured ? 50 : 0;
  const packageBonus = (ad.package?.weight ?? 1) * 10;
  const rankScore = featuredBonus + packageBonus + 20;

  await supabaseAdmin
    .from('ads')
    .update({
      status: newStatus,
      publish_at: publishDate.toISOString(),
      expire_at: expireDate.toISOString(),
      published_at: isPublished ? publishDate.toISOString() : null,
      is_visible_publicly: isPublished,
      is_featured: is_featured ?? false,
      featured_until: featured_until || null,
      rank_score: rankScore,
      updated_at: now.toISOString(),
    })
    .eq('id', id);

  await supabaseAdmin.from('ad_status_history').insert({
    ad_id: id,
    previous_status: 'payment_verified',
    new_status: newStatus,
    changed_by: auth.user!.id,
    note: action === 'schedule' ? `Scheduled for ${publishDate.toISOString()}` : 'Published immediately',
  });

  await supabaseAdmin.from('notifications').insert({
    user_id: ad.user_id,
    title: isPublished ? '🎉 Ad Published!' : '📅 Ad Scheduled',
    message: isPublished
      ? `Your ad "${ad.title}" is now live! It will expire on ${expireDate.toDateString()}.`
      : `Your ad "${ad.title}" is scheduled to publish on ${publishDate.toDateString()}.`,
    type: 'status_update',
    related_ad_id: id,
    link: '/client/dashboard',
  });

  return NextResponse.json({
    id,
    status: newStatus,
    publish_at: publishDate.toISOString(),
    expire_at: expireDate.toISOString(),
    message: `Ad ${action}d successfully`,
  });
}
