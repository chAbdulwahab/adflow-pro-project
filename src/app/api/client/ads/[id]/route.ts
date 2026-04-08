import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

// PATCH /api/client/ads/[id] - edit draft
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from('ads')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user!.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  if (!['draft', 'rejected'].includes(existing.status)) {
    return NextResponse.json({ error: 'Only draft or rejected ads can be edited' }, { status: 400 });
  }

  const { title, description, price, contact_phone, contact_email, category_id, city_id } = await req.json();

  const { data, error } = await supabaseAdmin
    .from('ads')
    .update({ title, description, price, contact_phone, contact_email, category_id, city_id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, message: 'Ad updated successfully' });
}

// DELETE /api/client/ads/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('ads')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user!.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Ad deleted' });
}
