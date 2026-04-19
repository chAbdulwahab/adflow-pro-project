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
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Review <span className="gradient-text">Queue</span></h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            {pagination ? `${pagination.total} ad${pagination.total !== 1 ? 's' : ''} awaiting review` : 'Loading…'}
          </p>
        </div>
        <button onClick={() => { setPage(1); setLoading(true); }} className="btn btn-ghost btn-sm">↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      ) : error ? (
        <div className="card" style={{ color: '#f87171' }}>{error}</div>
      ) : ads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Queue is empty</p>
          <p style={{ color: '#64748b' }}>No ads are currently waiting for review.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ads.map(ad => (
              <Link key={ad.id} href={`/moderator/ads/${ad.id}`}
                className="card card-hover"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, textDecoration: 'none' }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className={`badge ${STATUS_BADGE[ad.status] ?? 'badge-draft'}`}>{ad.status.replace(/_/g, ' ')}</span>
                    {ad.package_name && <span className="badge badge-featured" style={{ fontSize: 10 }}>{ad.package_name}</span>}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: '#e2e8f0', marginBottom: 4 }}>{ad.title}</p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>
                    {ad.category_name} · 📍{ad.city_name}
                    {ad.price ? ` · PKR ${Number(ad.price).toLocaleString()}` : ''}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 2 }}>{ad.owner_name}</p>
                  <p style={{ color: '#475569', fontSize: 12 }}>{ad.owner_email}</p>
                  <p style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
                    {new Date(ad.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <span className="btn btn-primary btn-sm">Review →</span>
                </div>
              </Link>
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
    </div>
  );
}
