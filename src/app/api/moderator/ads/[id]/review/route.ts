import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['moderator', 'admin', 'super_admin']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const { action, reason, internal_notes } = await req.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
  }
  if (action === 'reject' && !reason) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const { data: ad } = await supabaseAdmin.from('ads').select('*, users(id)').eq('id', id).single();
  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

  const newStatus = action === 'approve' ? 'payment_pending' : 'rejected';

  await supabaseAdmin
    .from('ads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  await supabaseAdmin.from('ad_status_history').insert({
    ad_id: id,
    previous_status: ad.status,
    new_status: newStatus,
    changed_by: auth.user!.id,
    note: reason || internal_notes || `Moderator ${action}d`,
  });

  // Notify client
  await supabaseAdmin.from('notifications').insert({
    user_id: ad.user_id,
    title: action === 'approve' ? '✅ Ad Approved' : '❌ Ad Rejected',
    message:
      action === 'approve'
        ? `Your ad "${ad.title}" has been approved. Please submit your payment to proceed.`
        : `Your ad "${ad.title}" was rejected. Reason: ${reason}`,
    type: action === 'approve' ? 'approval' : 'rejection',
    related_ad_id: id,
    link: '/client/dashboard',
  });

  return NextResponse.json({ id, status: newStatus, message: 'Review completed' });
}
