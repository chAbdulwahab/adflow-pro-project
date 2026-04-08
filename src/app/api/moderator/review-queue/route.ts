import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['moderator', 'admin', 'super_admin']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error, count } = await supabaseAdmin
    .from('ads')
    .select(
      '*, package:packages(*), category:categories(*), city:cities(*), seller:seller_profiles(*, user:users(id,name,email)), media:ad_media(*)',
      { count: 'exact' }
    )
    .in('status', ['submitted', 'under_review'])
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, queue_length: count ?? 0 });
}
