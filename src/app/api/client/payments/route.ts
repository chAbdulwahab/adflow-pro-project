import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { ad_id, amount, method, transaction_ref, sender_name, screenshot_url } = await req.json();

  if (!ad_id || !amount || !method || !transaction_ref) {
    return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
  }

  // Check ad ownership & status
  const { data: ad } = await supabaseAdmin
    .from('ads')
    .select('*, package:packages(*)')
    .eq('id', ad_id)
    .eq('user_id', auth.user!.id)
    .single();

  if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  if (ad.status !== 'payment_pending') {
    return NextResponse.json({ error: 'Ad is not in payment pending state' }, { status: 400 });
  }

  // Check duplicate transaction ref
  const { data: duplicate } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('transaction_ref', transaction_ref)
    .single();

  if (duplicate) {
    return NextResponse.json({ error: 'Transaction reference already used' }, { status: 409 });
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .insert({
      ad_id,
      user_id: auth.user!.id,
      amount,
      method,
      transaction_ref,
      sender_name,
      screenshot_url,
      status: 'submitted',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update ad status
  await supabaseAdmin
    .from('ads')
    .update({ status: 'payment_submitted', updated_at: new Date().toISOString() })
    .eq('id', ad_id);

  await supabaseAdmin.from('ad_status_history').insert({
    ad_id,
    previous_status: 'payment_pending',
    new_status: 'payment_submitted',
    changed_by: auth.user!.id,
    note: 'Payment proof submitted',
  });

  // Notify admins
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin']);

  if (admins) {
    await supabaseAdmin.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        title: 'Payment Submitted',
        message: `Payment of PKR ${amount} submitted for ad "${ad.title}".`,
        type: 'review_request',
        related_ad_id: ad_id,
        link: `/admin/payments`,
      }))
    );
  }

  return NextResponse.json({ ...payment, message: 'Payment submitted for verification' }, { status: 201 });
}
