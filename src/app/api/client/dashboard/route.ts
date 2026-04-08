import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['client']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const userId = auth.user!.id;

  const [adsRes, notifsRes] = await Promise.all([
    supabaseAdmin
      .from('ads')
      .select('*, package:packages(*), category:categories(*), city:cities(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const ads = adsRes.data || [];
  const stats = {
    total_ads: ads.length,
    active_ads: ads.filter((a: { status: string }) => a.status === 'published').length,
    pending_review: ads.filter((a: { status: string }) =>
      ['submitted', 'under_review'].includes(a.status)
    ).length,
    expired_ads: ads.filter((a: { status: string }) => a.status === 'expired').length,
  };

  return NextResponse.json({ stats, ads, notifications: notifsRes.data || [] });
}
