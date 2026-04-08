import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['admin', 'super_admin']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [usersRes, adsRes, paymentsRes, reviewRes] = await Promise.all([
    supabaseAdmin.from('users').select('id, role', { count: 'exact' }),
    supabaseAdmin.from('ads').select('id, status', { count: 'exact' }),
    supabaseAdmin.from('payments').select('id, status, amount'),
    supabaseAdmin.from('ads').select('id', { count: 'exact' }).in('status', ['submitted', 'under_review']),
  ]);

  const ads = adsRes.data || [];
  const payments = paymentsRes.data || [];

  const totalRevenue = payments
    .filter((p: { status: string }) => p.status === 'verified')
    .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);

  const pendingPayments = payments.filter((p: { status: string }) => p.status === 'submitted').length;

  // Revenue by package
  const { data: pkgRevenue } = await supabaseAdmin
    .from('payments')
    .select('amount, ad:ads(package:packages(name))')
    .eq('status', 'verified');

  const revenueByPackage: Record<string, number> = {};
  (pkgRevenue || []).forEach((p: { amount: number; ad?: { package?: { name?: string } } }) => {
    const name = p.ad?.package?.name ?? 'Unknown';
    revenueByPackage[name] = (revenueByPackage[name] || 0) + Number(p.amount);
  });

  // Ads by category
  const { data: catAds } = await supabaseAdmin
    .from('ads')
    .select('category:categories(name)')
    .eq('status', 'published');

  const adsByCategory: Record<string, number> = {};
  (catAds || []).forEach((a: { category?: { name?: string } }) => {
    const name = a.category?.name ?? 'Unknown';
    adsByCategory[name] = (adsByCategory[name] || 0) + 1;
  });

  return NextResponse.json({
    stats: {
      total_users: usersRes.count ?? 0,
      total_ads: adsRes.count ?? 0,
      active_ads: ads.filter((a: { status: string }) => a.status === 'published').length,
      pending_payments: pendingPayments,
      pending_reviews: reviewRes.count ?? 0,
      total_revenue: totalRevenue,
    },
    chart_data: {
      revenue_by_package: Object.entries(revenueByPackage).map(([package_name, revenue]) => ({ package: package_name, revenue })),
      ads_by_category: Object.entries(adsByCategory).map(([category, count]) => ({ category, count })),
    },
  });
}
