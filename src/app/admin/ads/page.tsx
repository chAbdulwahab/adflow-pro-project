'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Ad {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number | null;
  category_name: string;
  city_name: string;
  package_name: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
}

interface Pagination { total: number; page: number; pages: number; limit: number; }

const STATUS_COLORS: Record<string, string> = {
  published:    '#22c55e',
  draft:        '#94a3b8',
  submitted:    '#6366f1',
  under_review: '#f59e0b',
  rejected:     '#ef4444',
  expired:      '#64748b',
};

export default function AdminAdsPage() {
  const [ads,        setAds]        = useState<Ad[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,      setError]      = useState('');
  const [token,      setToken]      = useState('');
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('adflow_token') ?? '';
    setToken(t);
  }, []);

  const fetchAds = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `/api/admin/ads?page=${page}&limit=20${status ? `&status=${status}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const r = await res.json();
      if (r.success) {
        setAds(r.ads);
        setPagination(r.pagination);
      } else {
        setError(r.error ?? 'Failed to load ads');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [token, page, status]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This is permanent.`)) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAds(ads.filter(a => a.id !== id));
      } else {
        alert(data.error || 'Failed to delete ad');
      }
    } catch (err) {
      alert('Network error while deleting');
    } finally {
      setDeletingId(null);
    }
  };

  if (!token) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Admin Access Required</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Manage <span className="gradient-text">All Ads</span></h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            System-wide advertisement management and moderation.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAds()}
              style={{ 
                padding: '8px 12px', borderRadius: 8, background: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
                fontSize: 14, minWidth: 240 
              }}
            />
            <button 
              onClick={() => { setPage(1); fetchAds(); }}
              className="btn btn-primary btn-sm"
              style={{ padding: '0 16px' }}
            >
              Search
            </button>
          </div>

          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: 8, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14 }}
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          <button onClick={() => fetchAds()} className="btn btn-ghost btn-sm">↻ Refresh</button>
        </div>
      </div>

      {loading && ads.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>
      ) : error ? (
        <div className="card" style={{ color: '#f87171', textAlign: 'center' }}>{error}</div>
      ) : ads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>Empty</p>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No ads found</p>
          <p style={{ color: '#64748b' }}>Try changing the status filter or refresh the page.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px 140px', padding: '0 20px', color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <span>Advertisement</span>
              <span>Owner</span>
              <span>Details</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {ads.map(ad => (
              <div key={ad.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px 140px', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ 
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%', 
                      background: STATUS_COLORS[ad.status] || '#94a3b8' 
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLORS[ad.status] || '#94a3b8' }}>{ad.status.replace('_', ' ')}</span>
                  </div>
                  <Link href={`/ads/${ad.slug}`} style={{ fontWeight: 600, color: '#e2e8f0', textDecoration: 'none' }}>{ad.title}</Link>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{ad.category_name} · {ad.city_name}</p>
                </div>

                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  <p style={{ fontWeight: 600, color: '#cbd5e1' }}>{ad.owner_name}</p>
                  <p style={{ fontSize: 11 }}>{ad.owner_email}</p>
                </div>

                <div style={{ fontSize: 13, color: '#94a3b8' }}>
                  <p style={{ color: '#818cf8', fontWeight: 700 }}>PKR {ad.price?.toLocaleString() || 'Contact'}</p>
                  <p style={{ fontSize: 11 }}>{new Date(ad.created_at).toLocaleDateString()}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Link href={`/ads/${ad.slug}`} className="btn btn-ghost btn-sm" style={{ padding: '6px' }} title="View">👁️</Link>
                  <button 
                    onClick={() => handleDelete(ad.id, ad.title)}
                    disabled={deletingId === ad.id}
                    className="btn btn-ghost btn-sm" 
                    style={{ padding: '6px', color: '#f87171' }}
                    title="Delete"
                  >
                    {deletingId === ad.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>

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
