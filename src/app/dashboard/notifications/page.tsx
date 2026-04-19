'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [token,         setToken]         = useState('');

  const fetchNotifs = (t: string) => {
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(r => {
        if (r.success) {
          setNotifications(r.notifications);
          setUnreadCount(r.unread_count);
        } else setError(r.error ?? 'Failed to load notifications');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = localStorage.getItem('adflow_token') ?? '';
    setToken(t);
    if (t) fetchNotifs(t);
    else setLoading(false);
  }, []);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch { alert('Failed to mark all as read'); }
  };

  const markSingleRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation if clicking on a link overlay
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { alert('Failed to mark as read'); }
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this notification?')) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const removed = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (removed && !removed.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { alert('Failed to delete'); }
  };

  if (!token) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to continue</p>
        <Link href="/login" className="btn btn-primary">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <Link href="/dashboard" style={{ color: '#64748b', fontSize: 13, marginBottom: 12, display: 'inline-block' }}>← Back to Dashboard</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="gradient-text">Notifications</span>
            {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 800, padding: '2px 10px', borderRadius: 20 }}>{unreadCount} new</span>}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ color: '#94a3b8' }}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : error ? (
        <p style={{ color: '#f87171' }}>{error}</p>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>All caught up!</p>
          <p style={{ color: '#64748b' }}>You don't have any notifications right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => {
            const isUnread = !n.is_read;
            const cardStyles: React.CSSProperties = { 
              display: 'block', 
              padding: '18px 20px', 
              borderLeft: isUnread ? '4px solid #6366f1' : '4px solid transparent',
              background: isUnread ? 'rgba(99,102,241,0.06)' : 'var(--surface)',
              textDecoration: 'none',
              color: 'inherit'
            };

            const CardContent = (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818cf8' }}>
                      {n.type.replace(/_/g, ' ')}
                    </span>
                    {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#e2e8f0' }}>{n.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>{n.message}</p>
                  <p style={{ color: '#475569', fontSize: 12 }}>
                    {new Date(n.created_at).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Actions prevent following link */}
                <div style={{ display: 'flex', gap: 8, zIndex: 10 }}>
                  {isUnread && (
                    <button onClick={(e) => markSingleRead(n.id, e)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>
                      ✓ Mark read
                    </button>
                  )}
                  <button onClick={(e) => deleteNotif(n.id, e)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12, color: '#f87171' }}>
                    Trash
                  </button>
                </div>
              </div>
            );

            return (
              <div key={n.id} style={{ position: 'relative' }}>
                {n.link ? (
                  <Link href={n.link} className="card card-hover" style={cardStyles}>
                    {CardContent}
                  </Link>
                ) : (
                  <div className="card" style={cardStyles}>
                    {CardContent}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
