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

  const { action, reason } = await req.json();
  if (!['verify', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*, ad:ads(id, title, user_id, package:packages(duration_days))')
    .eq('id', id)
    .single();

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  const newPaymentStatus = action === 'verify' ? 'verified' : 'rejected';

  await supabaseAdmin
    .from('payments')
    .update({
      status: newPaymentStatus,
      verified_by: auth.user!.id,
      rejection_reason: reason || null,
      verified_at: action === 'verify' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (action === 'verify') {
    await supabaseAdmin
      .from('ads')
      .update({ status: 'payment_verified', updated_at: new Date().toISOString() })
      .eq('id', payment.ad.id);

    await supabaseAdmin.from('ad_status_history').insert({
      ad_id: payment.ad.id,
      previous_status: 'payment_submitted',
      new_status: 'payment_verified',
      changed_by: auth.user!.id,
      note: 'Payment verified by admin',
    });

    await supabaseAdmin.from('notifications').insert({
      user_id: payment.ad.user_id,
      title: '💳 Payment Verified',
      message: `Your payment for "${payment.ad.title}" has been verified. Your ad will be published soon.`,
      type: 'payment_verified',
      related_ad_id: payment.ad.id,
      link: '/client/dashboard',
    });
  } else {
    await supabaseAdmin
      .from('ads')
      .update({ status: 'payment_pending', updated_at: new Date().toISOString() })
      .eq('id', payment.ad.id);

    await supabaseAdmin.from('notifications').insert({
      user_id: payment.ad.user_id,
      title: '❌ Payment Rejected',
      message: `Your payment for "${payment.ad.title}" was rejected. Reason: ${reason}`,
      type: 'rejection',
      related_ad_id: payment.ad.id,
      link: '/client/dashboard',
    });
  }

  return NextResponse.json({ id, status: newPaymentStatus, message: `Payment ${action}d successfully` });
}
