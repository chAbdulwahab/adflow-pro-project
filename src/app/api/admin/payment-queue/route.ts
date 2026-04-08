import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['admin', 'super_admin']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error, count } = await supabaseAdmin
    .from('payments')
    .select('*, ad:ads(id, title, package:packages(*), user_id), user:users(id, name, email)', { count: 'exact' })
    .eq('status', 'submitted')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, queue_length: count ?? 0 });
}
