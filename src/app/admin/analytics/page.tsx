'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface Kpis {
  live_ads: string;
  pending_review: string;
  pending_payment: string;
  total_revenue: number;
  total_clients: string;
  ads_this_week: string;
}
interface AnalyticsData {
  period_days: number;
  kpis: Kpis;
  charts: {
    ad_status_distribution: { name: string; value: number }[];
    revenue_over_time:       { date: string; revenue: number; payment_count: number }[];
    ads_over_time:           { date: string; ads_created: number }[];
    top_categories:          { category: string; count: number }[];
    top_cities:              { city: string; count: number }[];
  };
}

// ── Colour palette ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  published:         '#22c55e',
  draft:             '#94a3b8',
  submitted:         '#38bdf8',
  under_review:      '#a78bfa',
  payment_pending:   '#fb923c',
  payment_submitted: '#fbbf24',
  payment_verified:  '#34d399',
  scheduled:         '#818cf8',
  expired:           '#f87171',
  rejected:          '#ef4444',
  archived:          '#475569',
};
const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a78bfa', '#fb923c', '#34d399'];

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#6366f1' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' }}>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>{label}</p>
      <p style={{ color, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Chart wrapper ─────────────────────────────────────────────────────────────
function ChartCard({ title, children, span = 1 }: { title: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={`chart-card span-${span}`} style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 24,
      gridColumn: `span ${span}`,
    }}>
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 20 }}>{title}</p>
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

  // ── Styles ──────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    padding: '40px 32px',
    fontFamily: "'Inter', sans-serif",
    color: '#e2e8f0',
  };

  if (!token) return (
    <div style={page}>
      <p style={{ color: '#94a3b8' }}>Paste your admin JWT token to view analytics:</p>
      <input
        style={{ marginTop: 12, width: '100%', maxWidth: 600, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        placeholder="Bearer eyJ..."
        onChange={e => { localStorage.setItem('adflow_token', e.target.value); setToken(e.target.value); }}
      />
    </div>
  );

  if (loading) return <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#94a3b8', fontSize: 18 }}>Loading analytics…</p></div>;
  if (error)   return <div style={{ ...page }}><p style={{ color: '#f87171' }}>Error: {error}</p></div>;
  if (!data)   return null;

  const { kpis, charts } = data;

  return (
    <div style={page} className="admin-page-container">
      {/* Header */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
            Analytics Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>AdFlow Pro — Admin View</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: days === d ? '#6366f1' : 'rgba(255,255,255,0.06)',
              color: days === d ? '#fff' : '#94a3b8',
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard label="Live Ads"          value={kpis.live_ads}         color="#22c55e" />
        <KpiCard label="Pending Review"    value={kpis.pending_review}   color="#38bdf8" sub="awaiting moderator" />
        <KpiCard label="Pending Payment"   value={kpis.pending_payment}  color="#fb923c" sub="awaiting verification" />
        <KpiCard label="Total Revenue"     value={`PKR ${Number(kpis.total_revenue).toLocaleString('en-PK')}`} color="#a78bfa" />
        <KpiCard label="Total Clients"     value={kpis.total_clients}    color="#fbbf24" />
        <KpiCard label="Ads This Week"     value={kpis.ads_this_week}    color="#34d399" />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>

        {/* Chart 1: Revenue Over Time */}
        <ChartCard title={`Revenue (Last ${days} Days)`} span={2}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.revenue_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', paddingTop: 10 }} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue (PKR)" />
              <Line type="monotone" dataKey="payment_count" stroke="#22c55e" strokeWidth={2} dot={false} name="Payments" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: New Ads Over Time */}
        <ChartCard title={`New Ads (Last ${days} Days)`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.ads_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Bar dataKey="ads_created" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Ads Created" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Ad Status Distribution */}
        <ChartCard title="Ad Status Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={charts.ad_status_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                {charts.ad_status_distribution.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Top Categories */}
        <ChartCard title="Top Categories (Live Ads)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.top_categories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis dataKey="category" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={90} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Published Ads">
                {charts.top_categories.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 5: Top Cities */}
        <ChartCard title="Top Cities (Live Ads)" span={2}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.top_cities}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="city" tick={{ fill: '#94a3b8', fontSize: 13 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Active Ads">
                {charts.top_cities.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
