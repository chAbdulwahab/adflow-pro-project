import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'rank';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('ads')
    .select(
      `
      *,
      package:packages(*),
      category:categories(*),
      city:cities(*),
      seller:seller_profiles(*, user:users(id, name, email)),
      media:ad_media(*)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .eq('is_visible_publicly', true)
    .gt('expire_at', new Date().toISOString());

  if (category) query = query.eq('categories.slug', category);
  if (city) query = query.eq('cities.slug', city);
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (sort === 'rank') query = query.order('rank_score', { ascending: false });
  else if (sort === 'newest') query = query.order('published_at', { ascending: false });
  else if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else if (sort === 'views') query = query.order('view_count', { ascending: false });
  else query = query.order('rank_score', { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: {
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    },
  });
}
