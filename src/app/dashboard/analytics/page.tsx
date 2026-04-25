'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Colour palette ────────────────────────────────────────────────────────────
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#fb923c', '#34d399'];
const STATUS_COLORS: Record<string, string> = {
  published: '#22c55e', draft: '#94a3b8', submitted: '#38bdf8',
  payment_pending: '#fb923c', payment_submitted: '#fbbf24',
  rejected: '#ef4444', expired: '#f87171', archived: '#475569', scheduled: '#818cf8',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Kpis {
  total_ads: number; live_ads: number;
  total_views: number; views_this_period: number; expiring_soon: number;
}
interface PerAd {
  id: string; title: string; slug: string; status: string;
  is_featured: boolean; price: number | null;
  created_at: string; expire_at: string;
  total_views: number; period_views: number;
}
interface AnalyticsData {
  period_days: number;
  kpis: Kpis;
  charts: {
    views_over_time:      { date: string; views: number }[];
    top_ads_by_views:     { title: string; slug: string; views: number; status: string }[];
    status_breakdown:     { name: string; value: number }[];
    views_by_day_of_week: { day: string; views: number }[];
  };
  per_ad: PerAd[];
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#6366f1', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 22, opacity: 0.12 }}>{icon}</div>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ color, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: '18px 16px',
    }}>
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>{title}</p>
      {children}
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#94a3b8';
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}33`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 11 },
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SellerAnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [days, setDays]       = useState(30);
  const [token, setToken]     = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('adflow_token');
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError('');
    fetch(`/api/dashboard/analytics?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(r => {
        if (r.success) setData(r);
        else setError(r.error ?? 'Failed to load analytics');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [token, days]);

  if (token === null) return null;

  if (!token) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 380 }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to see analytics</p>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Track views and performance for your ads.</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ marginBottom: 16 }} />
        <p style={{ color: '#64748b' }}>Loading your analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: '40px 16px', maxWidth: 600, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
        <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { kpis, charts, per_ad } = data;
  const hasViews = kpis.total_views > 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        marginBottom: 24,
        gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, marginBottom: 4 }}>
            My <span className="gradient-text">Analytics</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Performance overview for all your listings</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: days === d ? '#6366f1' : 'rgba(255,255,255,0.06)',
                color: days === d ? '#fff' : '#94a3b8',
              }}
            >
              {d}d
            </button>
          ))}
          <Link href="/dashboard" className="btn btn-ghost btn-sm">← My Ads</Link>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: isMobile ? 10 : 14,
        marginBottom: 24,
      }}>
        <KpiCard icon="📋" label="Total Ads"          value={kpis.total_ads}                         color="#818cf8" />
        <KpiCard icon="✅" label="Live Ads"            value={kpis.live_ads}                          color="#22c55e" sub="currently published" />
        <KpiCard icon="👁️" label="Total Views"         value={kpis.total_views.toLocaleString()}      color="#38bdf8" sub="all time" />
        <KpiCard icon="📈" label={`Views (${days}d)`} value={kpis.views_this_period.toLocaleString()} color="#a78bfa" sub={`last ${days} days`} />
        <KpiCard icon="⏰" label="Expiring Soon"       value={kpis.expiring_soon}                     color="#f59e0b" sub="within 3 days" />
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!hasViews && (
        <div className="card" style={{
          textAlign: 'center', padding: isMobile ? '32px 20px' : '48px 32px',
          marginBottom: 24,
          background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)',
        }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>👁️</p>
          <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>No views recorded yet</p>
          <p style={{ color: '#64748b', maxWidth: 340, margin: '0 auto 20px', fontSize: 14 }}>
            Once your ads go live and people visit them, your stats will appear here.
          </p>
          <Link href="/ads/new" className="btn btn-primary">Post a New Ad</Link>
        </div>
      )}

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      {hasViews && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>

          {/* Chart 1: Views over time — always full width */}
          <ChartCard title={`Daily Views — Last ${days} Days`}>
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 230}>
              <LineChart data={charts.views_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Row: Top ads + Day of week — side by side on desktop, stacked on mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 16,
          }}>
            {/* Chart 2: Top ads by views */}
            <ChartCard title="Top Ads by Views (All Time)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={charts.top_ads_by_views}
                  layout="vertical"
                  margin={{ left: isMobile ? 4 : 8, right: 16, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                  <YAxis
                    dataKey="title"
                    type="category"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    width={isMobile ? 80 : 100}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="views" radius={[0, 4, 4, 0]} name="Views">
                    {charts.top_ads_by_views.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 3: Views by day of week */}
            <ChartCard title="Views by Day of Week">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.views_by_day_of_week} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} width={28} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]} fill="#38bdf8" name="Views" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Chart 4: Status breakdown — smaller on mobile */}
          <ChartCard title="Your Ads by Status">
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 220}>
              <PieChart>
                <Pie
                  data={charts.status_breakdown}
                  dataKey="value" nameKey="name"
                  cx="50%" cy="45%"
                  outerRadius={isMobile ? 65 : 80}
                  innerRadius={isMobile ? 30 : 40}
                >
                  {charts.status_breakdown.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  layout="horizontal" verticalAlign="bottom" align="center"
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      )}

      {/* ── Per-Ad Breakdown ──────────────────────────────────────────────── */}
      {per_ad.length > 0 && (
        <div>
          <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, marginBottom: 14 }}>
            Per-Ad Breakdown
          </h2>

          {isMobile ? (
            /* Mobile: card list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {per_ad.map(ad => {
                const daysLeft = ad.expire_at
                  ? Math.max(0, Math.ceil((new Date(ad.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;
                const expiringSoon = daysLeft !== null && daysLeft <= 3 && ad.status === 'published';
                return (
                  <div key={ad.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0', flex: 1 }}>
                        {ad.title.slice(0, 40)}{ad.title.length > 40 ? '…' : ''}
                      </p>
                      <StatusPill status={ad.status} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>TOTAL VIEWS</p>
                        <p style={{ color: '#818cf8', fontWeight: 800, fontSize: 20 }}>{ad.total_views}</p>
                      </div>
                      <div style={{ background: 'rgba(34,197,94,0.06)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                        <p style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>{days}D VIEWS</p>
                        <p style={{ color: '#22c55e', fontWeight: 800, fontSize: 20 }}>
                          {ad.period_views > 0 ? `+${ad.period_views}` : '—'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {ad.is_featured && <span style={{ fontSize: 10, color: '#f59e0b' }}>⭐ Featured</span>}
                        {expiringSoon && <span style={{ fontSize: 11, color: '#f59e0b' }}>⏰ {daysLeft}d left</span>}
                        {ad.price && <span style={{ color: '#64748b', fontSize: 12 }}>PKR {Number(ad.price).toLocaleString()}</span>}
                      </div>
                      {ad.status === 'published' ? (
                        <Link href={`/ads/${ad.slug}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>View →</Link>
                      ) : (ad.status === 'draft' || ad.status === 'rejected') ? (
                        <Link href={`/ads/${ad.id}/edit`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>Edit</Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: table */
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 80px',
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 11, color: '#64748b', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                <span>Ad</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Total Views</span>
                <span style={{ textAlign: 'right' }}>{days}d Views</span>
                <span style={{ textAlign: 'center' }}>Action</span>
              </div>

              {/* Rows */}
              {per_ad.map((ad, i) => {
                const daysLeft = ad.expire_at
                  ? Math.max(0, Math.ceil((new Date(ad.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;
                const expiringSoon = daysLeft !== null && daysLeft <= 3 && ad.status === 'published';
                return (
                  <div
                    key={ad.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 80px',
                      padding: '13px 20px',
                      borderBottom: i < per_ad.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>
                          {ad.title.slice(0, 45)}{ad.title.length > 45 ? '…' : ''}
                        </p>
                        {ad.is_featured && (
                          <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#64748b' }}>
                        {ad.price && <span>PKR {Number(ad.price).toLocaleString()}</span>}
                        {expiringSoon && <span style={{ color: '#f59e0b' }}>⏰ {daysLeft}d left</span>}
                      </div>
                    </div>
                    <div><StatusPill status={ad.status} /></div>
                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: ad.total_views > 0 ? '#818cf8' : '#475569' }}>
                      {ad.total_views.toLocaleString()}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14, color: ad.period_views > 0 ? '#22c55e' : '#475569' }}>
                      {ad.period_views > 0 ? `+${ad.period_views}` : '—'}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {ad.status === 'published' ? (
                        <Link href={`/ads/${ad.slug}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>View →</Link>
                      ) : (ad.status === 'draft' || ad.status === 'rejected') ? (
                        <Link href={`/ads/${ad.id}/edit`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>Edit</Link>
                      ) : <span style={{ color: '#475569', fontSize: 11 }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
