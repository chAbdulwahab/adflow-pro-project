import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const { data: ad } = await supabaseAdmin
    .from('ads')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user!.id)
    .single();

  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  if (!['draft', 'rejected'].includes(ad.status)) {
    return NextResponse.json({ error: 'Only draft or rejected ads can be submitted' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('ads')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('ad_status_history').insert({
    ad_id: id,
    previous_status: ad.status,
    new_status: 'submitted',
    changed_by: auth.user!.id,
    note: 'Ad submitted for review',
  });

  // Notify moderators
  const { data: mods } = await supabaseAdmin
    .from('users')
    .select('id')
    .in('role', ['moderator', 'admin', 'super_admin']);

  if (mods) {
    await supabaseAdmin.from('notifications').insert(
      mods.map((m: { id: string }) => ({
        user_id: m.id,
        title: 'New Ad Submitted',
        message: `Ad "${ad.title}" has been submitted for review.`,
        type: 'review_request',
        related_ad_id: id,
        link: `/moderator/review/${id}`,
      }))
    );
  }

  return NextResponse.json({ id, status: 'submitted', message: 'Ad submitted for moderation' });
}
