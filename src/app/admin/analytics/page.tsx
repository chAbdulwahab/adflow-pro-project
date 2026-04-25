'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Kpis {
  live_ads: string; pending_review: string; pending_payment: string;
  total_revenue: number; total_clients: string; ads_this_week: string;
}
interface AnalyticsData {
  period_days: number;
  kpis: Kpis;
  charts: {
    ad_status_distribution: { name: string; value: number }[];
    revenue_over_time:       { date: string; revenue: number; payment_count: number }[];
    ads_over_time:           { date: string; ads_created: number }[]
    top_categories:          { category: string; count: number }[];
    top_cities:              { city: string; count: number }[];
  };
}

// ── Palettes ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  published: '#22c55e', draft: '#94a3b8', submitted: '#38bdf8',
  under_review: '#a78bfa', payment_pending: '#fb923c',
  payment_submitted: '#fbbf24', payment_verified: '#34d399',
  scheduled: '#818cf8', expired: '#f87171', rejected: '#ef4444', archived: '#475569',
};
const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#38bdf8','#a78bfa','#fb923c','#34d399'];

const tt = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 11 },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#6366f1', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 22, opacity: 0.13 }}>{icon}</div>
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
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '18px 16px',
    }}>
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>{title}</p>
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [days, setDays]       = useState(30);
  const [token, setToken]     = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('adflow_token') ?? '');
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`, {
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

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    padding: isMobile ? '24px 16px' : '40px 32px',
    fontFamily: "'Inter', sans-serif",
    color: '#e2e8f0',
  };

  if (!token) return (
    <div style={pageStyle} className="admin-page-container">
      <p style={{ color: '#94a3b8', marginBottom: 12 }}>Paste your admin JWT token to view analytics:</p>
      <input
        style={{ width: '100%', maxWidth: 600, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        placeholder="Bearer eyJ..."
        onChange={e => { localStorage.setItem('adflow_token', e.target.value); setToken(e.target.value); }}
      />
    </div>
  );

  if (loading) return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="admin-page-container">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: '#94a3b8' }}>Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={pageStyle} className="admin-page-container">
      <p style={{ color: '#f87171' }}>Error: {error}</p>
    </div>
  );

  if (!data) return null;

  const { kpis, charts } = data;

  return (
    <div style={pageStyle} className="admin-page-container">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: isMobile ? 20 : 32,
        gap: 14,
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? 22 : 28, fontWeight: 800, marginBottom: 4,
            background: 'linear-gradient(90deg, #818cf8, #38bdf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Analytics Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>AdFlow Pro — Admin View</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: days === d ? '#6366f1' : 'rgba(255,255,255,0.06)',
              color: days === d ? '#fff' : '#94a3b8',
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 20 : 28,
      }}>
        <KpiCard icon="✅" label="Live Ads"        value={kpis.live_ads}        color="#22c55e" />
        <KpiCard icon="🔍" label="Pending Review"  value={kpis.pending_review}  color="#38bdf8" sub="awaiting moderator" />
        <KpiCard icon="💳" label="Pending Payment" value={kpis.pending_payment} color="#fb923c" sub="awaiting verification" />
        <KpiCard icon="💰" label="Total Revenue"   value={`PKR ${Number(kpis.total_revenue).toLocaleString('en-PK')}`} color="#a78bfa" />
        <KpiCard icon="👥" label="Total Clients"   value={kpis.total_clients}   color="#fbbf24" />
        <KpiCard icon="📋" label="Ads This Week"   value={kpis.ads_this_week}   color="#34d399" />
      </div>

      {/* ── Charts — stacked flex column ────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Chart 1: Revenue Over Time — always full width */}
        <ChartCard title={`Revenue — Last ${days} Days`}>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
            <LineChart data={charts.revenue_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} interval={isMobile ? 'preserveStartEnd' : 0} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={isMobile ? 36 : 50} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="revenue"       stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue (PKR)" />
              <Line type="monotone" dataKey="payment_count" stroke="#22c55e" strokeWidth={2} dot={false} name="Payments" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row: New Ads + Status side-by-side on desktop, stacked on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

          {/* Chart 2: New Ads Over Time */}
          <ChartCard title={`New Ads — Last ${days} Days`}>
            <ResponsiveContainer width="100%" height={isMobile ? 190 : 230}>
              <BarChart data={charts.ads_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} interval={isMobile ? 'preserveStartEnd' : 0} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip {...tt} />
                <Bar dataKey="ads_created" fill="#38bdf8" radius={[4,4,0,0]} name="Ads Created" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 3: Status Distribution */}
          <ChartCard title="Ad Status Distribution">
            <ResponsiveContainer width="100%" height={isMobile ? 210 : 230}>
              <PieChart>
                <Pie
                  data={charts.ad_status_distribution}
                  dataKey="value" nameKey="name"
                  cx="50%" cy="42%"
                  outerRadius={isMobile ? 65 : 78}
                  innerRadius={isMobile ? 28 : 36}
                >
                  {charts.ad_status_distribution.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip {...tt} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row: Top Categories + Top Cities side-by-side on desktop, stacked on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

          {/* Chart 4: Top Categories */}
          <ChartCard title="Top Categories (Live Ads)">
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
              <BarChart data={charts.top_categories} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <YAxis
                  dataKey="category" type="category"
                  tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 78 : 90}
                />
                <Tooltip {...tt} />
                <Bar dataKey="count" radius={[0,4,4,0]} name="Live Ads">
                  {charts.top_categories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 5: Top Cities */}
          <ChartCard title="Top Cities (Live Ads)">
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
              <BarChart data={charts.top_cities}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} interval={0} angle={isMobile ? -30 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 44 : 30} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip {...tt} />
                <Bar dataKey="count" radius={[4,4,0,0]} name="Active Ads">
                  {charts.top_cities.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
