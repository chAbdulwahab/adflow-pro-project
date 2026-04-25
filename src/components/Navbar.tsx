'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

interface JWTUser { id: string; name: string; email: string; role: string; }

function decodeJWT(token: string): JWTUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload as JWTUser;
  } catch { return null; }
}

const ROLE_HOME: Record<string, string> = {
  super_admin: '/admin/analytics',
  admin:       '/admin/analytics',
  moderator:   '/moderator/ads',
  client:      '/dashboard',
};

export default function Navbar() {
  const [user, setUser] = useState<JWTUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  // Theme-aware colour tokens for inline styles
  const c = {
    text:        isDark ? '#e2e8f0'                    : '#0f172a',
    muted:       isDark ? '#94a3b8'                    : '#475569',
    dim:         isDark ? '#64748b'                    : '#64748b',
    surface:     isDark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.05)',
    border:      isDark ? 'rgba(255,255,255,0.1)'      : 'rgba(0,0,0,0.1)',
    divider:     isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.08)',
    cardBg:      isDark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.04)',
    cardBorder:  isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.08)',
    dropdownBg:  isDark ? '#1a2035'                    : '#ffffff',
    dropdownShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.15)',
    drawerBg:    isDark ? '#0d0d1a'                    : '#f8fafc',
    sectionLabel: isDark ? '#475569'                   : '#94a3b8',
    linkBg:      isDark ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.04)',
    linkBorder:  isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(0,0,0,0.07)',
    accentBg:    isDark ? 'rgba(99,102,241,0.1)'       : 'rgba(99,102,241,0.08)',
    accentBorder: isDark ? 'rgba(99,102,241,0.2)'      : 'rgba(99,102,241,0.2)',
    dangerBg:    isDark ? 'rgba(239,68,68,0.08)'       : 'rgba(220,38,38,0.07)',
    dangerBorder: isDark ? 'rgba(239,68,68,0.2)'       : 'rgba(220,38,38,0.2)',
    closeBtn:    isDark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.06)',
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsDropdownOpen(false);
    const token = localStorage.getItem('adflow_token');
    if (token) {
      setUser(decodeJWT(token));
      fetchUnread(token);
    } else {
      setUser(null);
      setUnreadCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      const token = localStorage.getItem('adflow_token');
      if (token) fetchUnread(token);
    }, 10000);
    return () => clearInterval(t);
  }, [user]);

  const fetchUnread = async (token: string) => {
    try {
      const res = await fetch('/api/chat/unread-count', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUnreadCount(data.count);
    } catch { /* ignore */ }
  };

  const logout = () => {
    localStorage.removeItem('adflow_token');
    setUser(null);
    setIsDropdownOpen(false);
    router.push('/');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isMod   = user?.role === 'moderator';

  const navLinkStyle = (href: string): React.CSSProperties => ({
    color: pathname === href ? '#818cf8' : c.muted,
    fontWeight: 500, fontSize: 14, padding: '6px 12px',
    borderRadius: 8, transition: 'color 0.2s', whiteSpace: 'nowrap',
  });

  if (!mounted) {
    return (
      <nav className="navbar" suppressHydrationWarning>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff' }}>A</div>
            <span style={{ fontWeight: 800, fontSize: 18 }}>AdFlow <span style={{ color: '#818cf8' }}>Pro</span></span>
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="navbar" suppressHydrationWarning>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

          {/* Left: Hamburger + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              style={{ background: 'none', border: 'none', color: c.text, fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1, display: 'none' }}
              className="hamburger-btn"
              aria-label="Menu"
            >
              {isMobileOpen ? '✕' : '☰'}
            </button>

            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff' }}>A</div>
              <span style={{ fontWeight: 800, fontSize: 18, color: c.text }}>AdFlow <span style={{ color: '#818cf8' }}>Pro</span></span>
            </Link>
          </div>

          {/* Centre – desktop nav links */}
          <div className="nav-center-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href="/explore" style={navLinkStyle('/explore')}>Explore</Link>
            {user && <Link href={ROLE_HOME[user.role] ?? '/dashboard'} style={navLinkStyle(ROLE_HOME[user.role] ?? '/dashboard')}>Dashboard</Link>}
            {isAdmin && <Link href="/admin/ads"       style={navLinkStyle('/admin/ads')}>Manage Ads</Link>}
            {isAdmin && <Link href="/admin/users"     style={navLinkStyle('/admin/users')}>Users</Link>}
            {isAdmin && <Link href="/admin/analytics" style={navLinkStyle('/admin/analytics')}>Analytics</Link>}
            {isMod   && <Link href="/moderator/ads"   style={navLinkStyle('/moderator/ads')}>Review Queue</Link>}
          </div>

          {/* Right – theme toggle + auth actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                {user.role === 'client' && (
                  <Link href="/ads/new" className="btn btn-primary btn-sm nav-post-btn">+ Post Ad</Link>
                )}
                {/* Profile dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsDropdownOpen(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: c.text, fontSize: 13 }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="nav-user-name">{user.email.split('@')[0]}</span>
                    <span style={{ color: c.dim, fontSize: 10 }}>▾</span>
                  </button>

                  {isDropdownOpen && (
                    <div onClick={() => setIsDropdownOpen(false)} style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: c.dropdownBg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '8px', minWidth: 210, zIndex: 9000, boxShadow: c.dropdownShadow }}>
                      <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${c.divider}`, marginBottom: 6 }}>
                        <p style={{ color: c.dim, fontSize: 11, marginBottom: 2 }}>Signed in as</p>
                        <p style={{ color: '#818cf8', fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</p>
                        <p style={{ color: c.muted, fontSize: 11 }}>{user.email}</p>
                      </div>

                      {user.role === 'client' && (
                        <Link href="/dashboard" style={{ display: 'block', padding: '9px 14px', borderRadius: 8, color: c.text, fontSize: 13, fontWeight: 500 }} className="dd-item">📋 My Ads</Link>
                      )}

                      {isAdmin && (
                        <>
                          <Link href="/admin/ads"       style={{ display: 'block', padding: '9px 14px', borderRadius: 8, color: '#818cf8', fontSize: 13, fontWeight: 600 }} className="dd-item">📋 Manage Ads</Link>
                          <Link href="/admin/users"     style={{ display: 'block', padding: '9px 14px', borderRadius: 8, color: '#38bdf8', fontSize: 13, fontWeight: 600 }} className="dd-item">👥 Manage Users</Link>
                          <Link href="/admin/analytics" style={{ display: 'block', padding: '9px 14px', borderRadius: 8, color: c.text,   fontSize: 13 }} className="dd-item">📊 Analytics</Link>
                          <Link href="/admin/payments"  style={{ display: 'block', padding: '9px 14px', borderRadius: 8, color: '#fb923c', fontSize: 13 }} className="dd-item">💰 Payments</Link>
                        </>
                      )}

                      {isMod && (
                        <Link href="/moderator/ads" style={{ display: 'block', padding: '9px 14px', borderRadius: 8, color: c.text, fontSize: 13 }} className="dd-item">🛡️ Review Queue</Link>
                      )}

                      <div style={{ borderTop: `1px solid ${c.divider}`, marginTop: 6, paddingTop: 6 }}>
                        <Link href="/dashboard/chat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 8, color: unreadCount > 0 ? '#818cf8' : c.text, fontSize: 13, fontWeight: unreadCount > 0 ? 600 : 500 }} className="dd-item">
                          <span>💬 Messages</span>
                          {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>{unreadCount}</span>}
                        </Link>
                        <button onClick={logout} style={{ display: 'block', width: '100%', padding: '9px 14px', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }} className="dd-item-danger">Sign Out →</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-signin-link" style={{ color: c.muted, fontSize: 14, fontWeight: 500, padding: '6px 12px' }}>Sign In</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Full-Screen Drawer ───────────────────────────── */}
      {isMobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: c.drawerBg, zIndex: 9998, display: 'flex', flexDirection: 'column' }}>
          {/* Drawer header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, padding: '0 24px', borderBottom: `1px solid ${c.divider}`, flexShrink: 0 }}>
            <Link href="/" onClick={() => setIsMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#fff' }}>A</div>
              <span style={{ fontWeight: 800, fontSize: 18, color: c.text }}>AdFlow <span style={{ color: '#818cf8' }}>Pro</span></span>
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Theme toggle inside drawer */}
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button onClick={() => setIsMobileOpen(false)} style={{ width: 40, height: 40, background: c.closeBtn, border: `1px solid ${c.border}`, borderRadius: 10, color: c.text, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>

          {/* Drawer body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: c.sectionLabel, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>Explore</p>
            {[
              { href: '/explore',  label: '🔍  Explore Ads' },
              { href: '/packages', label: '📦  Pricing & Plans' },
              { href: '/faq',      label: '❓  Help & FAQ' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setIsMobileOpen(false)} style={{ display: 'block', padding: '16px 20px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: c.text, background: c.linkBg, border: `1px solid ${c.linkBorder}`, marginBottom: 10 }}>
                {label}
              </Link>
            ))}

            {user && (
              <>
                <p style={{ fontSize: 10, fontWeight: 800, color: c.sectionLabel, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '24px 0 14px' }}>My Account</p>
                <Link href={ROLE_HOME[user.role] ?? '/dashboard'} onClick={() => setIsMobileOpen(false)} style={{ display: 'block', padding: '16px 20px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: '#818cf8', background: c.accentBg, border: `1px solid ${c.accentBorder}`, marginBottom: 10 }}>
                  📊  Dashboard
                </Link>
                <Link href="/dashboard/chat" onClick={() => setIsMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, fontSize: 16, fontWeight: 700, color: c.text, background: c.linkBg, border: `1px solid ${c.linkBorder}`, marginBottom: 10 }}>
                  <span>💬  Messages</span>
                  {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{unreadCount}</span>}
                </Link>
              </>
            )}
          </div>

          {/* Drawer footer */}
          <div style={{ padding: '20px', borderTop: `1px solid ${c.divider}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!user ? (
              <>
                <Link href="/login"    onClick={() => setIsMobileOpen(false)} className="btn btn-ghost"   style={{ justifyContent: 'center', height: 52, fontSize: 16, borderRadius: 14 }}>Sign In</Link>
                <Link href="/register" onClick={() => setIsMobileOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center', height: 52, fontSize: 16, borderRadius: 14 }}>Create Account</Link>
              </>
            ) : (
              <>
                <Link href="/ads/new" onClick={() => setIsMobileOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center', height: 52, fontSize: 16, borderRadius: 14 }}>+ Post New Ad</Link>
                <button onClick={() => { logout(); setIsMobileOpen(false); }} style={{ height: 52, borderRadius: 14, background: c.dangerBg, border: `1px solid ${c.dangerBorder}`, color: '#f87171', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Sign Out</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
