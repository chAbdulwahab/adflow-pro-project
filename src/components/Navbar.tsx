'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
      position: 'relative',
      color: pathname === href ? 'var(--primary-h)' : 'var(--muted)',
      fontWeight: 600, fontSize: 14, padding: '8px 12px', borderRadius: 8,
      transition: 'all 0.3s',
    }}>
      {label}
      {pathname === href && (
        <motion.div 
          layoutId="nav-underline"
          style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, background: 'var(--primary)', borderRadius: 2 }}
        />
      )}
    </Link>
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar glass">
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6, ease: "anticipate" }}
            style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--gradient-brand)', display:'flex',alignItems:'center',justifyContent:'center', fontWeight:800, fontSize:16, color:'#fff', boxShadow: '0 0 15px var(--primary-glow)' }}
          >
            A
          </motion.div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            AdFlow <span className="gradient-text">Pro</span>
          </span>
        </Link>

        {/* Centre nav links (Desktop) */}
        <div className="nav-center" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLink('/explore', 'Explore')}
          {user && navLink(ROLE_HOME[user.role] ?? '/dashboard', 'Dashboard')}
          {isAdmin && navLink('/admin/analytics', 'Analytics')}
          {isAdmin && navLink('/admin/payments',  'Payments')}
          {isMod   && navLink('/moderator/ads',   'Review Queue')}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="mobile-only-flex" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ 
              display: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              width: 42, height: 42, borderRadius: '12px', cursor: 'pointer',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5
            }}
          >
            <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 2 }} />
          </button>

          <div className="desktop-only-flex" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                {user.role === 'client' && (
                  <Link href="/ads/new" className="btn btn-primary btn-sm pulse">+ Post Ad</Link>
                )}
                <div style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 12px', cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-brand)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                      {user.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="hide-on-mobile" style={{ fontWeight: 600 }}>{user.email.split('@')[0]}</span>
                    <span style={{ color: 'var(--dim)', fontSize: 10 }}>▼</span>
                  </motion.button>
                  
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="glass"
                        style={{ position: 'absolute', right: 0, top: 'calc(100% + 12px)', padding: 8, minWidth: 220, zIndex: 200, boxShadow: 'var(--shadow-lg)' }}
                      >
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                          <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 2 }}>Access Level</p>
                          <p style={{ color: 'var(--primary-h)', fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className="dropdown-item">Profile Settings</Link>
                          <Link href="/dashboard/notifications" onClick={() => setMenuOpen(false)} className="dropdown-item">Notifications</Link>
                          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                          <button onClick={logout} className="dropdown-item" style={{ color: 'var(--danger)', fontWeight: 600 }}>Sign Out</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href="/login" style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>Sign In</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 900px) {
            .mobile-only-flex { display: flex !important; }
            .desktop-only-flex { display: none !important; }
            .hide-on-mobile { display: none !important; }
          }
          .dropdown-item {
            display: block;
            padding: 10px 12px;
            border-radius: 8px;
            color: var(--muted);
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .dropdown-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text);
            padding-left: 16px;
          }
        `}</style>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, 
              background: 'rgba(2, 2, 5, 0.98)', 
              backdropFilter: 'blur(15px)',
              zIndex: 100000, 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '60px 24px'
            }}
          >
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              style={{ position: 'absolute', top: 30, right: 30, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}
            >
              ✕
            </button>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ 
                display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', width: '100%', maxWidth: '300px',
                overflowY: 'auto', maxHeight: '80vh', padding: '20px 0'
              }}
            >
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#fff', fontSize: 18, fontWeight: 700, textDecoration: 'none', padding: '10px' }}>Home</Link>
              <Link href="/explore" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#fff', fontSize: 18, fontWeight: 700, textDecoration: 'none', padding: '10px' }}>Marketplace</Link>
              
              {user && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />
                  <Link href={ROLE_HOME[user.role] ?? '/dashboard'} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#fff', fontSize: 18, fontWeight: 700, textDecoration: 'none', padding: '10px' }}>Dashboard</Link>
                  
                  {isAdmin && (
                    <>
                      <Link href="/admin/analytics" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--primary-h)', fontSize: 18, fontWeight: 700, textDecoration: 'none', padding: '10px' }}>Analytics</Link>
                      <Link href="/admin/payments" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--primary-h)', fontSize: 18, fontWeight: 700, textDecoration: 'none', padding: '10px' }}>Payments</Link>
                    </>
                  )}
                  
                  {isMod && (
                    <Link href="/moderator/ads" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 700, textDecoration: 'none', padding: '10px' }}>Review Queue</Link>
                  )}
                  
                  <Link href="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 600, textDecoration: 'none', padding: '10px' }}>Account Settings</Link>
                </>
              )}

              <div style={{ marginTop: 10, padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                {!user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500 }}>READY TO ACCESS?</p>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', height: 48, borderRadius: 100, fontSize: 14, fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 4 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-brand)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        {user.email[0].toUpperCase()}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{user.email.split('@')[0]}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <button onClick={logout} style={{ width: '100%', height: 48, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 14, fontWeight: 700, borderRadius: 100, cursor: 'pointer' }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
