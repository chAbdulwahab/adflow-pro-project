'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  amount: number;
  method: string;
  transaction_ref: string;
  sender_name: string;
  screenshot_url: string | null;
  status: string;
  rejection_note: string | null;
  created_at: string;
  verified_at: string | null;
  ad_id: string;
  ad_title: string;
  ad_status: string;
  package_name: string;
  package_price: number;
  owner_name: string;
  owner_email: string;
  verified_by_name: string | null;
}

interface Pagination { total: number; page: number; pages: number; limit: number; }

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: '🏦 Bank Transfer',
  jazzcash:      '📱 JazzCash',
  easypaisa:     '📱 EasyPaisa',
};

export default function AdminPaymentsPage() {
  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page,       setPage]       = useState(1);
  const [tab,        setTab]        = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [token,      setToken]      = useState('');

  // Review modal state
  const [selected,   setSelected]   = useState<Payment | null>(null);
  const [action,     setAction]     = useState<'verify' | 'reject' | null>(null);
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('adflow_token') ?? '');
    }
  }, []);

  const fetchPayments = () => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/payments?status=${tab}&page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(r => {
        if (r.success) { setPayments(r.payments); setPagination(r.pagination); }
        else setError(r.error ?? 'Failed to load payments');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [token, tab, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReview = async () => {
    if (!selected || !action) return;
    if (action === 'reject' && note.trim().length < 5) {
      alert('Please provide a rejection note (at least 5 characters).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/payments/${selected.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, rejection_note: action === 'reject' ? note : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        setAction(null);
        setNote('');
        fetchPayments();
      } else {
        alert(data.error ?? 'Failed to submit review');
      }
    } catch { alert('Network error'); }
    finally { setSubmitting(false); }
  };

  const page_style: React.CSSProperties = { minHeight: '100vh', padding: '40px 24px' };

  if (!token) return (
    <div style={page_style} className="container">
      <p style={{ color: '#94a3b8' }}>You must be signed in as an admin.</p>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>
            Payment <span className="gradient-text">Verification</span>
          </h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            {pagination ? `${pagination.total} payment${pagination.total !== 1 ? 's' : ''} in queue` : 'Loading…'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              if (!confirm('This will immediately publish all ads stuck at "payment_verified" status. Continue?')) return;
              const res = await fetch('/api/admin/ads/publish-verified', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              const d = await res.json();
              alert(d.message ?? (d.success ? 'Done!' : d.error));
              fetchPayments();
            }}
            className="btn btn-ghost btn-sm"
            style={{ color: '#fb923c', borderColor: 'rgba(251,146,60,0.3)' }}
          >
            ⚡ Fix Stuck Ads
          </button>
          <button onClick={fetchPayments} className="btn btn-ghost btn-sm">↻ Refresh</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['pending', 'verified', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      ) : error ? (
        <div className="card" style={{ color: '#f87171' }}>{error}</div>
      ) : payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No {tab} payments</p>
          <p style={{ color: '#64748b' }}>
            {tab === 'pending' ? 'All payment submissions have been reviewed.' : `No ${tab} payments to show.`}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {payments.map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>

                {/* Left: payment info */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      background: p.status === 'pending' ? 'rgba(251,146,60,0.15)' : p.status === 'verified' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color:      p.status === 'pending' ? '#fb923c'              : p.status === 'verified' ? '#22c55e'              : '#ef4444',
                    }}>
                      {p.status}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{METHOD_LABEL[p.method] ?? p.method}</span>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: 20, color: '#818cf8', marginBottom: 2 }}>
                    PKR {Number(p.amount).toLocaleString()}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                    Ref: <code style={{ color: '#e2e8f0' }}>{p.transaction_ref}</code>
                    {' · '}Sender: <strong style={{ color: '#e2e8f0' }}>{p.sender_name}</strong>
                  </p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>
                    📄 <strong style={{ color: '#94a3b8' }}>{p.ad_title}</strong>
                    {p.package_name && ` · ${p.package_name}`}
                  </p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                    👤 {p.owner_name} · {p.owner_email}
                  </p>
                </div>

                {/* Centre: screenshot + timestamp */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  {p.screenshot_url ? (
                    <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', marginBottom: 6 }}>
                      <img
                        src={p.screenshot_url}
                        alt="receipt"
                        style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </a>
                  ) : (
                    <div style={{ width: 90, height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <span style={{ color: '#475569', fontSize: 11 }}>No receipt</span>
                    </div>
                  )}
                  <p style={{ color: '#475569', fontSize: 11 }}>
                    {new Date(p.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Right: actions */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                  {p.status === 'pending' ? (
                    <button
                      onClick={() => { setSelected(p); setAction(null); setNote(''); }}
                      className="btn btn-primary btn-sm"
                      style={{ justifyContent: 'center' }}
                    >
                      Review →
                    </button>
                  ) : (
                    <div>
                      {p.verified_by_name && (
                        <p style={{ color: '#475569', fontSize: 11 }}>
                          By: {p.verified_by_name}
                        </p>
                      )}
                      {p.rejection_note && (
                        <p style={{ color: '#f87171', fontSize: 11, marginTop: 2 }}>
                          Note: {p.rejection_note}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-ghost btn-sm" style={{ opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ padding: '7px 14px', color: '#94a3b8', fontSize: 13 }}>Page {page} of {pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="btn btn-ghost btn-sm" style={{ opacity: page === pagination.pages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── Review Modal ──────────────────────────────────────────────── */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520, position: 'relative' }}>

            {/* Close */}
            <button onClick={() => setSelected(null)} style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1,
            }}>✕</button>

            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Review Payment</p>

            {/* Payment summary */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ color: '#818cf8', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
                PKR {Number(selected.amount).toLocaleString()}
              </p>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>
                {METHOD_LABEL[selected.method] ?? selected.method}
                {' · '}Ref: <code style={{ color: '#e2e8f0' }}>{selected.transaction_ref}</code>
              </p>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Sender: <strong style={{ color: '#e2e8f0' }}>{selected.sender_name}</strong>
              </p>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                Ad: <strong style={{ color: '#e2e8f0' }}>{selected.ad_title}</strong>
              </p>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                Client: {selected.owner_name} · {selected.owner_email}
              </p>
              {selected.screenshot_url && (
                <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, color: '#38bdf8', fontSize: 13, fontWeight: 600 }}>
                  📎 View Receipt Screenshot →
                </a>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setAction('verify')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                  border: `2px solid ${action === 'verify' ? '#22c55e' : 'rgba(255,255,255,0.08)'}`,
                  background: action === 'verify' ? 'rgba(34,197,94,0.12)' : 'var(--surface)',
                  color: action === 'verify' ? '#22c55e' : '#94a3b8',
                }}
              >
                ✅ Verify Payment
              </button>
              <button
                onClick={() => setAction('reject')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
                  border: `2px solid ${action === 'reject' ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                  background: action === 'reject' ? 'rgba(239,68,68,0.12)' : 'var(--surface)',
                  color: action === 'reject' ? '#ef4444' : '#94a3b8',
                }}
              >
                ❌ Reject Payment
              </button>
            </div>

            {/* Approve info */}
            {action === 'verify' && (
              <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', marginBottom: 14 }}>
                <p style={{ color: '#22c55e', fontSize: 13 }}>
                  Payment will be marked <strong>verified</strong>. Ad will move to <strong>payment_verified</strong> and be queued for publishing.
                </p>
              </div>
            )}

            {/* Rejection note */}
            {action === 'reject' && (
              <div className="form-group">
                <label>Rejection Note *</label>
                <textarea
                  className="textarea"
                  placeholder="Explain why payment is rejected (e.g. transaction ref not found, wrong amount)…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ minHeight: 80, fontSize: 13 }}
                />
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  Ad will return to <strong>payment_pending</strong>. Client will be notified and can resubmit.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={submitReview}
              disabled={!action || submitting}
              className={`btn btn-lg ${action === 'verify' ? 'btn-success' : action === 'reject' ? 'btn-danger' : 'btn-ghost'}`}
              style={{ width: '100%', justifyContent: 'center', opacity: (!action || submitting) ? 0.5 : 1, marginTop: 4 }}
            >
              {submitting ? 'Submitting…' : !action ? 'Select an action above' : action === 'verify' ? 'Confirm Verification' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
