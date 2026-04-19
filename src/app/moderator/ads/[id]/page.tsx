'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface AdDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number | null;
  is_featured: boolean;
  created_at: string;
  category_name: string;
  city_name: string;
  package_name: string;
  owner_name: string;
  owner_email: string;
  media: { source_type: string; original_url: string; normalized_thumbnail_url: string; validation_status: string }[];
  history: { new_status: string; note: string; changed_by_name: string | null; changed_at: string }[];
}

export default function ModeratorReviewPage() {
  const router = useRouter();
  const params = useParams();
  const adId   = params.id as string;

  const [ad,      setAd]      = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [action,  setAction]  = useState<'approve' | 'reject' | null>(null);
  const [reason,  setReason]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,    setDone]    = useState(false);
  const [token,   setToken]   = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('adflow_token') ?? '';
    setToken(t);
    if (!t) return;
    fetch(`/api/moderator/ads/${adId}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(r => { 
        if (r.success) {
          setAd({ ...r.ad, media: r.media, history: r.history });
        } else {
          setError(r.error ?? 'Failed to load');
        } 
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [adId]);

  const submitReview = async () => {
    if (!action) return;
    if (action === 'reject' && reason.trim().length < 5) {
      alert('Please provide a rejection reason (at least 5 characters).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/moderator/ads/${adId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, rejection_reason: action === 'reject' ? reason : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => router.push('/moderator/ads'), 1800);
      } else {
        alert(data.error ?? 'Failed to submit review');
      }
    } catch { alert('Network error'); }
    finally   { setSubmitting(false); }
  };

  const page: React.CSSProperties = { minHeight: '100vh', padding: '40px 24px', maxWidth: 840, margin: '0 auto' };

  if (loading) return <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (error)   return <div style={page}><p style={{ color: '#f87171' }}>{error}</p><Link href="/moderator/ads" className="btn btn-ghost" style={{ marginTop: 12 }}>← Back to Queue</Link></div>;
  if (!ad)     return null;

  // If review was submitted
  if (done) return (
    <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 56 }}>{action === 'approve' ? '✅' : '❌'}</div>
      <p style={{ fontSize: 22, fontWeight: 800, color: action === 'approve' ? '#22c55e' : '#f87171' }}>
        {action === 'approve' ? 'Ad Approved!' : 'Ad Rejected'}
      </p>
      <p style={{ color: '#64748b' }}>Redirecting back to queue…</p>
    </div>
  );

  const alreadyReviewed = !['submitted', 'under_review'].includes(ad.status);

  return (
    <div style={page}>
      {/* Back link */}
      <Link href="/moderator/ads" style={{ color: '#64748b', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        ← Back to Queue
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Ad content ────────────────────────────── */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span className={`badge ${ad.status === 'submitted' ? 'badge-submitted' : ad.status === 'rejected' ? 'badge-rejected' : 'badge-featured'}`}>
                {ad.status.replace(/_/g, ' ')}
              </span>
              {ad.package_name && <span className="badge badge-featured">{ad.package_name}</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{ad.title}</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {ad.category_name} · 📍{ad.city_name}
              {ad.price ? ` · PKR ${Number(ad.price).toLocaleString()}` : ' · Price on request'}
            </p>
          </div>

          {/* Media preview */}
          {ad.media?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 12, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Media</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {ad.media.map((m, i) => (
                  <a key={i} href={m.original_url} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', display: 'block', textDecoration: 'none' }} title="Click to view original media">
                    {m.normalized_thumbnail_url ? (
                      <img src={m.normalized_thumbnail_url} alt={`media-${i}`} style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 8, border: m.validation_status === 'valid' ? '2px solid #22c55e' : '2px solid #ef4444' }} />
                    ) : (
                      <div style={{ width: 140, height: 90, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ef4444' }}>
                        <span style={{ color: '#64748b', fontSize: 12 }}>No preview</span>
                      </div>
                    )}
                    <span style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: m.validation_status === 'valid' ? '#22c55e' : '#ef4444', color: '#fff' }}>
                      {m.validation_status}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card" style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, marginBottom: 10, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</p>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ad.description}</p>
          </div>

          {/* Status history */}
          {ad.history?.length > 0 && (
            <div className="card">
              <p style={{ fontWeight: 600, marginBottom: 14, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status History</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ad.history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{h.new_status?.replace(/_/g, ' ') || 'Unknown'}</p>
                      {h.note && <p style={{ fontSize: 12, color: '#64748b' }}>{h.note}</p>}
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {h.changed_by_name || 'System'} · {new Date(h.changed_at).toLocaleString('en-PK')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Owner info + Review panel ──────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Owner info */}
          <div className="card">
            <p style={{ fontWeight: 600, marginBottom: 12, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seller</p>
            <p style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{ad.owner_name}</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>{ad.owner_email}</p>
            <p style={{ color: '#475569', fontSize: 12, marginTop: 8, marginBottom: 12 }}>
              Posted: {new Date(ad.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#f87171', width: '100%', justifyContent: 'center', border: '1px solid rgba(248,113,113,0.2)' }}
              onClick={() => setDeleteConfirmOpen(true)}
            >🗑️ Delete Ad Permanently</button>
          </div>

          {/* Review panel */}
          {alreadyReviewed ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 14 }}>This ad has already been reviewed ({ad.status.replace(/_/g, ' ')}).</p>
            </div>
          ) : (
            <div className="card">
              <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Submit Review</p>

              {/* Action selector */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  onClick={() => setAction('approve')}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `2px solid ${action === 'approve' ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, background: action === 'approve' ? 'rgba(34,197,94,0.12)' : 'var(--surface)', color: action === 'approve' ? '#22c55e' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => setAction('reject')}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: `2px solid ${action === 'reject' ? '#ef4444' : 'rgba(255,255,255,0.08)'}`, background: action === 'reject' ? 'rgba(239,68,68,0.12)' : 'var(--surface)', color: action === 'reject' ? '#ef4444' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}
                >
                  ❌ Reject
                </button>
              </div>

              {/* Rejection reason */}
              {action === 'reject' && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    className="textarea"
                    placeholder="Explain why this ad is being rejected…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{ minHeight: 80, fontSize: 13 }}
                  />
                  <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>This message will be sent to the seller.</p>
                </div>
              )}

              {/* Approve info */}
              {action === 'approve' && (
                <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', marginBottom: 14 }}>
                  <p style={{ color: '#22c55e', fontSize: 13 }}>Ad will move to <strong>payment_pending</strong>. The seller will be notified to complete payment.</p>
                </div>
              )}

              <button
                onClick={submitReview}
                disabled={!action || submitting}
                className={`btn btn-lg ${action === 'approve' ? 'btn-success' : action === 'reject' ? 'btn-danger' : 'btn-ghost'}`}
                style={{ width: '100%', justifyContent: 'center', opacity: (!action || submitting) ? 0.5 : 1 }}
              >
                {submitting ? 'Submitting…' : !action ? 'Select an action above' : action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: '32px 24px', textAlign: 'center', background: '#0f172a', border: '1px solid #1e293b' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26, border: '1px solid rgba(239,68,68,0.2)' }}>🛑</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#e2e8f0' }}>Admin Delete?</h2>
            <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>WARNING: This is a highly destructive action.</p>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>You are about to irreversibly remove this ad bypassing all user checks. This cannot be undone. Are you completely sure?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setDeleteConfirmOpen(false)} 
                className="btn btn-ghost" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0', border: '1px solid rgba(255,255,255,0.1)' }}
              >Cancel</button>
              <button 
                onClick={async () => {
                  setDeleteConfirmOpen(false);
                  try {
                    const res = await fetch(`/api/ads/${adId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    const d = await res.json();
                    if (d.success) {
                      router.push('/moderator/ads');
                    } else {
                      alert(d.error);
                    }
                  } catch {
                    alert('Network error deleting ad');
                  }
                }} 
                className="btn" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600, borderRadius: 8 }}
              >Yes, Delete It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
