import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Increment view count
  await supabaseAdmin.rpc('increment_view', { ad_slug: slug }).maybeSingle();

  const { data, error } = await supabaseAdmin
    .from('ads')
    .select(
      `
      *,
      package:packages(*),
      category:categories(*),
      city:cities(*),
      seller:seller_profiles(*, user:users(id, name, email)),
      media:ad_media(*)
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_visible_publicly', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
