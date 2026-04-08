import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

// GET /api/client/ads - list my ads
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from('ads')
    .select('*, package:packages(*), category:categories(*), city:cities(*), media:ad_media(*)')
    .eq('user_id', auth.user!.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/client/ads - create draft
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { title, description, category_id, city_id, package_id, price, contact_phone, contact_email } = body;

  if (!title || !description || !category_id || !city_id || !package_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const slug = generateSlug(title);

  const { data, error } = await supabaseAdmin
    .from('ads')
    .insert({
      user_id: auth.user!.id,
      package_id,
      category_id,
      city_id,
      title,
      slug,
      description,
      status: 'draft',
      price: price || null,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log status history
  await supabaseAdmin.from('ad_status_history').insert({
    ad_id: data.id,
    previous_status: null,
    new_status: 'draft',
    changed_by: auth.user!.id,
    note: 'Ad draft created',
  });

  return NextResponse.json({ ...data, message: 'Draft created successfully' }, { status: 201 });
}
