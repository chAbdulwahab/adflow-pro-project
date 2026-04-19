'use client';

import { useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface HealthData {
  status: 'healthy' | 'warning' | 'degraded';
  db: { connected: boolean; latency_ms: number; time: string; version: string };
  attention: {
    ads_awaiting_review: string;
    ads_awaiting_payment_verify: string;
    ads_awaiting_publish: string;
    ads_scheduled: string;
    ads_expiring_soon: string;
  };
  logs_24h: Record<string, { count: number; avg_ms: number }>;
  recent_logs: { source: string; response_ms: number; status: string; details: Record<string, unknown>; checked_at: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  healthy:  '#22c55e',
  warning:  '#f59e0b',
  degraded: '#ef4444',
  ok:       '#22c55e',
  error:    '#ef4444',
};

const STATUS_BG: Record<string, string> = {
  ok:      'rgba(34,197,94,0.1)',
  warning: 'rgba(245,158,11,0.1)',
  error:   'rgba(239,68,68,0.1)',
};

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: STATUS_BG[status] ?? 'rgba(148,163,184,0.1)',
      color: STATUS_COLOR[status] ?? '#94a3b8',
      border: `1px solid ${STATUS_COLOR[status] ?? '#94a3b8'}40`,
    }}>
      {status.toUpperCase()}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 16, fontSize: 15 }}>{title}</p>
      {children}
    </div>
  );
}

function AttentionRow({ label, value, urgent }: { label: string; value: string | number; urgent?: boolean }) {
  const n = parseInt(String(value));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#94a3b8', fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 18, color: urgent && n > 0 ? '#fb923c' : n === 0 ? '#22c55e' : '#e2e8f0' }}>
        {n}
      </span>
    </div>
  );
}

export default function HealthPage() {
  const [data, setData]       = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [token, setToken]     = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setToken(localStorage.getItem('adflow_token') ?? '');
  }, []);

  const fetchHealth = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/health', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(r => {
        if (r.success) { setData(r); setLastRefresh(new Date()); }
        else setError(r.error ?? 'Failed');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHealth(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #1a1a3e, #0f2027)',
    padding: '40px 32px',
    fontFamily: "'Inter', sans-serif",
    color: '#e2e8f0',
  };

  if (!token) return (
    <div style={page}>
      <p style={{ color: '#94a3b8' }}>Paste your admin JWT token:</p>
      <input
        style={{ marginTop: 12, width: '100%', maxWidth: 600, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14 }}
        placeholder="eyJ..."
        onChange={e => { localStorage.setItem('adflow_token', e.target.value); setToken(e.target.value); }}
      />
    </div>
  );

  if (loading) return <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#94a3b8' }}>Checking system health…</p></div>;
  if (error)   return <div style={page}><p style={{ color: '#f87171' }}>Error: {error}</p></div>;
  if (!data)   return null;

  const overallColor = STATUS_COLOR[data.status] ?? '#94a3b8';

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #34d399, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
            System Health
          </h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Last checked: {lastRefresh?.toLocaleTimeString('en-PK') ?? 'never'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: '10px 20px', borderRadius: 12, border: `2px solid ${overallColor}`, background: `${overallColor}18` }}>
            <span style={{ color: overallColor, fontWeight: 700, fontSize: 16 }}>● {data.status.toUpperCase()}</span>
          </div>
          <button onClick={fetchHealth} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer', fontWeight: 600 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Database">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: data.db.connected ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${data.db.connected ? '#22c55e' : '#ef4444'}` }} />
            <span style={{ fontWeight: 600, color: data.db.connected ? '#22c55e' : '#ef4444' }}>
              {data.db.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {[
            { label: 'Latency', value: `${data.db.latency_ms} ms` },
            { label: 'Version', value: data.db.version },
            { label: 'DB Time', value: new Date(data.db.time).toLocaleTimeString('en-PK') },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>{r.label}</span>
              <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}>{r.value}</span>
            </div>
          ))}
        </Card>

        <Card title="⚠️ Needs Attention">
          <AttentionRow label="Ads Awaiting Review"         value={data.attention.ads_awaiting_review}         urgent />
          <AttentionRow label="Ads Awaiting Payment Verify" value={data.attention.ads_awaiting_payment_verify} urgent />
          <AttentionRow label="Ads Awaiting Publish"        value={data.attention.ads_awaiting_publish}        urgent />
          <AttentionRow label="Ads Scheduled"               value={data.attention.ads_scheduled} />
          <AttentionRow label="Ads Expiring in 3 Days"      value={data.attention.ads_expiring_soon}           urgent />
        </Card>
      </div>

      <Card title="Last 24 Hours — Cron Log Summary">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(data.logs_24h).map(([status, stat]) => (
            <div key={status} style={{ flex: '1 1 160px', background: STATUS_BG[status] ?? 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', border: `1px solid ${STATUS_COLOR[status] ?? '#334155'}30` }}>
              <p style={{ color: STATUS_COLOR[status] ?? '#94a3b8', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{status.toUpperCase()}</p>
              <p style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 800 }}>{stat.count}</p>
              <p style={{ color: '#64748b', fontSize: 12 }}>avg {stat.avg_ms} ms</p>
            </div>
          ))}
          {Object.keys(data.logs_24h).length === 0 && <p style={{ color: '#475569', fontSize: 14 }}>No cron runs yet in the last 24 hours.</p>}
        </div>
      </Card>

      <div style={{ marginTop: 20 }}>
        <Card title="Recent Health Logs">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Source', 'Status', 'Response (ms)', 'Details', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '9px 12px', color: '#e2e8f0', fontFamily: 'monospace' }}>{log.source}</td>
                    <td style={{ padding: '9px 12px' }}><Badge status={log.status} /></td>
                    <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{log.response_ms}</td>
                    <td style={{ padding: '9px 12px', color: '#64748b', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#64748b' }}>{new Date(log.checked_at).toLocaleTimeString('en-PK')}</td>
                  </tr>
                ))}
                {data.recent_logs.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#475569' }}>No logs yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
