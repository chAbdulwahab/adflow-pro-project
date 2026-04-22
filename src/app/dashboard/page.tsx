'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Access Denied</p>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>You need an active session to access your dashboard.</p>
        <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>Sign In to Continue</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 32, fontWeight: 800 }}>Command <span className="gradient-text">Center</span></motion.h1>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ color: 'var(--muted)', marginTop: 4 }}>You have {ads.length} active transmissions in the marketplace.</motion.p>
        </div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/ads/new" className="btn btn-primary">+ New Transmission</Link>
        </motion.div>
      </div>

      {/* Summary stat cards */}
      {ads.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 16, marginBottom: 40 }}>
          {(['published', 'draft', 'submitted', 'payment_pending', 'rejected'] as const).map((s, idx) => {
            const count = ads.filter(a => a.status === s).length;
            return (
              <motion.div 
                key={s} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.05 }}
                className="glass-card" 
                style={{ padding: '20px' }}
              >
                <p style={{ color: 'var(--dim)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>{s.replace(/_/g, ' ')}</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{count}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Ads list */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></motion.div>
        ) : error ? (
          <motion.p key="error" style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</motion.p>
        ) : ads.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ textAlign: 'center', padding: 80 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🛰️</p>
            <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>No transmissions found</p>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Your broadcast history is empty. Start your first campaign now.</p>
            <Link href="/ads/new" className="btn btn-primary btn-lg">Launch Campaign</Link>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ads.map((ad, idx) => (
              <motion.div 
                key={ad.id} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: idx * 0.05 }}
                className="glass-card" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '24px' }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className={`badge ${STATUS_BADGE[ad.status] ?? 'badge-draft'}`} style={{ border: '1px solid currentColor', background: 'transparent' }}>
                      {ad.status.replace(/_/g, ' ')}
                    </span>
                    {ad.package_name && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary-h)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {ad.package_name} Protocol
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: '#fff' }}>{ad.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
                    {ad.category_name} <span style={{ opacity: 0.3 }}>|</span> 📍 {ad.city_name} <span style={{ opacity: 0.3 }}>|</span> <span style={{ color: 'var(--primary-h)' }}>{ad.price ? `PKR ${ad.price.toLocaleString()}` : 'Contact'}</span>
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  {(ad.status === 'draft' || ad.status === 'rejected') && (
                    <Link href={`/ads/${ad.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  )}
                  {ad.status === 'draft' && (
                    <button
                      className="btn btn-primary btn-sm pulse"
                      onClick={async () => {
                        const t = localStorage.getItem('adflow_token');
                        const res = await fetch(`/api/ads/${ad.id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } });
                        const d = await res.json();
                        if (d.success) setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'submitted' } : a));
                        else alert(d.error);
                      }}
                    >Submit Review</button>
                  )}
                  {ad.status === 'payment_pending' && (
                    <Link href={`/ads/${ad.id}/payment`} className="btn btn-primary btn-sm">Authorize Payment</Link>
                  )}
                  {ad.status === 'published' && (
                    <Link href={`/ads/${ad.slug}`} className="btn btn-ghost btn-sm">View System →</Link>
                  )}
                  
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    onClick={() => setDeleteConfirmId(ad.id)}
                  >Delete</button>
                  
                  <span style={{ color: 'var(--dim)', fontSize: 11, fontWeight: 600, marginLeft: 8 }}>
                    {new Date(ad.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass" 
              style={{ maxWidth: 450, width: '100%', padding: '48px 32px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}
            >
              <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>⚠️</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Confirm Deletion</h2>
              <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>This action will permanently terminate this transmission from the marketplace database. This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className="btn btn-ghost" 
                  style={{ flex: 1, height: 48 }}
                >Abort</button>
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
                      alert('Network failure');
                    }
                  }} 
                  className="btn" 
                  style={{ flex: 1, height: 48, background: 'var(--danger)', color: '#fff', fontWeight: 700 }}
                >Terminate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

