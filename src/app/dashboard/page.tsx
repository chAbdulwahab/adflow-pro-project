'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-draft', submitted: 'badge-submitted', published: 'badge-published',
  rejected: 'badge-rejected', expired: 'badge-expired', scheduled: 'badge-scheduled',
  payment_pending: 'badge-pending', payment_submitted: 'badge-pending', payment_verified: 'badge-verified',
  under_review: 'badge-submitted', archived: 'badge-draft',
};

interface Ad { id: string; title: string; slug: string; status: string; price: number | null; category_name: string; city_name: string; package_name: string; created_at: string; }

export default function DashboardPage() {
  const [ads,     setAds]     = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [token,   setToken]   = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('adflow_token') ?? '';
    setToken(t);
    if (!t) { setLoading(false); return; }
    fetch('/api/ads', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(r => { if (r.success) setAds(r.ads); else setError(r.error); })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (!token) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to continue</p>
        <p style={{ color: '#64748b', marginBottom: 20 }}>You need an account to view your dashboard.</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>My <span className="gradient-text">Ads</span></h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{ads.length} listing{ads.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/ads/new" className="btn btn-primary">+ Post New Ad</Link>
      </div>

      {/* Summary stat cards */}
      {ads.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 14, marginBottom: 32 }}>
          {(['published', 'draft', 'submitted', 'payment_pending', 'rejected'] as const).map(s => {
            const count = ads.filter(a => a.status === s).length;
            return (
              <div key={s} className="card" style={{ padding: '16px 18px' }}>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.replace(/_/g, ' ')}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0' }}>{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Ads list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : error ? (
        <p style={{ color: '#f87171' }}>{error}</p>
      ) : ads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No ads yet</p>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Post your first listing and start reaching buyers.</p>
          <Link href="/ads/new" className="btn btn-primary">Post Your First Ad</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ads.map(ad => (
            <div key={ad.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className={`badge ${STATUS_BADGE[ad.status] ?? 'badge-draft'}`}>{ad.status.replace(/_/g, ' ')}</span>
                  {ad.package_name && <span className="badge badge-featured" style={{ fontSize: 10 }}>{ad.package_name}</span>}
                </div>
                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{ad.title}</p>
                <p style={{ color: '#64748b', fontSize: 13 }}>{ad.category_name} · 📍{ad.city_name} · {ad.price ? `PKR ${ad.price.toLocaleString()}` : 'No price'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {/* Edit button — available for draft and rejected ads */}
                {(ad.status === 'draft' || ad.status === 'rejected') && (
                  <Link href={`/ads/${ad.id}/edit`} className="btn btn-ghost btn-sm">✏️ Edit</Link>
                )}
                {ad.status === 'draft' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={async () => {
                      const t = localStorage.getItem('adflow_token');
                      const res = await fetch(`/api/ads/${ad.id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } });
                      const d = await res.json();
                      if (d.success) setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'submitted' } : a));
                      else alert(d.error);
                    }}
                  >Submit for Review</button>
                )}
                {ad.status === 'payment_pending' && (
                  <Link href={`/ads/${ad.id}/payment`} className="btn btn-primary btn-sm">Pay Now</Link>
                )}
                {ad.status === 'published' && (
                  <Link href={`/ads/${ad.slug}`} className="btn btn-ghost btn-sm">View Live →</Link>
                )}
                
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#f87171' }}
                  onClick={() => setDeleteConfirmId(ad.id)}
                >🗑️ Delete</button>
                
                <span style={{ color: '#475569', fontSize: 12 }}>{new Date(ad.created_at).toLocaleDateString('en-PK')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: '32px 24px', textAlign: 'center', background: '#0f172a', border: '1px solid #1e293b' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26, border: '1px solid rgba(239,68,68,0.2)' }}>🛑</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: '#e2e8f0' }}>Delete Ad Permanently?</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>By proceeding, this ad will be irreversibly removed from the marketplace. Are you completely sure?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="btn btn-ghost" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0', border: '1px solid rgba(255,255,255,0.1)' }}
              >Cancel</button>
              <button 
                onClick={async () => {
                  const adId = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    const t = localStorage.getItem('adflow_token');
                    const res = await fetch(`/api/ads/${adId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
                    const d = await res.json();
                    if (d.success) setAds(prev => prev.filter(a => a.id !== adId));
                    else alert(d.error);
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
