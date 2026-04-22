'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Ad {
  id: string;
  title: string;
  status: string;
  price: number | null;
  category_name: string;
  city_name: string;
  package_name: string;
  owner_name: string;
  owner_email: string;
  submitted_at: string;
  created_at: string;
}

interface Pagination { total: number; page: number; pages: number; limit: number; }

const STATUS_BADGE: Record<string, string> = {
  submitted:    'badge-submitted',
  under_review: 'badge-featured',
  rejected:     'badge-rejected',
};

export default function ModeratorQueuePage() {
  const [ads,        setAds]        = useState<Ad[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [token,      setToken]      = useState('');

  useEffect(() => {
    const t = localStorage.getItem('adflow_token') ?? '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/moderator/ads?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(r => {
        if (r.success) { setAds(r.ads); setPagination(r.pagination); }
        else setError(r.error ?? 'Failed to load queue');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [token, page]);

  if (!token) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Sign in as Moderator</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div 
      suppressHydrationWarning
      style={{ 
        minHeight: '100vh', padding: '60px 24px', 
        background: 'radial-gradient(circle at 10% 10%, rgba(14,165,233,0.05) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(99,102,241,0.05) 0%, transparent 50%)' 
      }}
    >
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em' }}>MODERATION NETWORK</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>Review <span className="gradient-text">Queue</span></h1>
            <p style={{ color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>
              {pagination ? `${pagination.total} active submissions awaiting verification` : 'Synchronizing queue...'}
            </p>
          </div>
          <button 
            onClick={() => { setPage(1); setLoading(true); }} 
            className="btn btn-ghost"
            style={{ height: 44, borderRadius: 12, fontSize: 13, padding: '0 16px' }}
          >
            ↻ Refresh Node
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Retrieving ad data packets...</p>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: 24, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#ef4444', fontWeight: 600 }}>ERROR: {error}</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '80px 40px', borderRadius: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🛡️</div>
            <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Network Clear</p>
            <p style={{ color: 'var(--muted)', fontWeight: 500 }}>No submissions require immediate moderation.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ads.map(ad => (
                <Link 
                  key={ad.id} href={`/moderator/ads/${ad.id}`}
                  className="glass-card"
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '24px 32px', borderRadius: 24, textDecoration: 'none',
                    transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.05)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateX(8px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span className={`badge ${STATUS_BADGE[ad.status] ?? 'badge-draft'}`} style={{ fontSize: 10 }}>{ad.status.toUpperCase()}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-h)', letterSpacing: '0.05em' }}>{ad.package_name?.toUpperCase()}</span>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 4 }}>{ad.title}</p>
                    <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>
                      {ad.category_name} <span style={{ color: 'var(--dim)', margin: '0 6px' }}>/</span> 📍 {ad.city_name}
                      {ad.price && <span style={{ color: 'var(--secondary)', marginLeft: 8, fontWeight: 700 }}>PKR {Number(ad.price).toLocaleString()}</span>}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', marginRight: 32, display: 'none' /* Hidden on small screens via flex logic if needed, but here simple */ }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{ad.owner_name}</p>
                    <p style={{ color: 'var(--dim)', fontSize: 11 }}>{ad.owner_email}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{ad.owner_name}</p>
                      <p style={{ color: 'var(--dim)', fontSize: 11 }}>{new Date(ad.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize: 18, boxShadow: '0 0 15px var(--primary-glow)' }}>
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 48 }}>
                <button 
                  disabled={page === 1} onClick={() => setPage(p => p - 1)} 
                  className="btn btn-ghost" style={{ width: 100, borderRadius: 12, opacity: page === 1 ? 0.3 : 1 }}
                >
                  PREVIOUS
                </button>
                <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
                  PACKET {page} / {pagination.pages}
                </div>
                <button 
                  disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} 
                  className="btn btn-ghost" style={{ width: 100, borderRadius: 12, opacity: page === pagination.pages ? 0.3 : 1 }}
                >
                  NEXT
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
