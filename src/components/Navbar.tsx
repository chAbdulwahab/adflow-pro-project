'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('adflow_token');
    if (token) setUser(decodeJWT(token));
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('adflow_token');
    setUser(null);
    router.push('/');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isMod   = user?.role === 'moderator';

  const navLink = (href: string, label: string) => (
    <Link key={`${href}-${label}`} href={href} style={{
      color: pathname === href ? '#818cf8' : '#94a3b8',
      fontWeight: 500, fontSize: 14, padding: '6px 10px', borderRadius: 8,
      transition: 'color 0.2s',
    }}>{label}</Link>
  );

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display:'flex',alignItems:'center',justifyContent:'center', fontWeight:800, fontSize:14, color:'#fff' }}>A</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>AdFlow <span style={{ color: '#818cf8' }}>Pro</span></span>
        </Link>

        {/* Centre nav links */}
        <div className="nav-center" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLink('/explore', 'Explore')}
          {user && navLink(ROLE_HOME[user.role] ?? '/dashboard', 'Dashboard')}
          {isAdmin && navLink('/admin/analytics', 'Analytics')}
          {isAdmin && navLink('/admin/payments',  'Payments')}
          {isAdmin && navLink('/admin/health',    'Health')}
          {isMod   && navLink('/moderator/ads',   'Review Queue')}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              {/* Only clients can post new ads */}
              {user.role === 'client' && (
                <Link href="/ads/new" className="btn btn-primary btn-sm">+ Post Ad</Link>
              )}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: '#e2e8f0', fontSize: 13 }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email.split('@')[0]}</span>
                  <span style={{ color: '#64748b' }}>▾</span>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, minWidth: 180, zIndex: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                      <p style={{ color: '#64748b', fontSize: 11 }}>Signed in as</p>
                      <p style={{ color: '#818cf8', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</p>
                    </div>

                    {/* Dynamic Links Based on Role */}
                    {user.role === 'client' && (
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', fontSize: 13, transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>My Ads</Link>
                    )}
                    {isAdmin && (
                      <>
                        <Link href="/admin/analytics" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Analytics</Link>
                        <Link href="/admin/payments" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#fb923c', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>💰 Payments</Link>
                        <Link href="/admin/health" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>System Health</Link>
                      </>
                    )}
                    {isMod && (
                      <Link href="/moderator/ads" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Review Queue</Link>
                    )}

                    {/* All logged-in users have profile and notifications */}
                    <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Profile Settings</Link>
                    <Link href="/dashboard/notifications" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4, paddingBottom: 12 }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Notifications</Link>

                    <button onClick={logout} style={{ display: 'block', width: '100%', padding: '8px 12px', borderRadius: 8, color: '#f87171', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {navLink('/login', 'Sign In')}
              <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
