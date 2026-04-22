'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form,     setForm]     = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const ROLE_HOME: Record<string, string> = {
    super_admin: '/admin/analytics', admin: '/admin/analytics',
    moderator: '/moderator/ads', client: '/dashboard',
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Login failed'); return; }
      localStorage.setItem('adflow_token', data.token);
      router.push(ROLE_HOME[data.user.role] ?? '/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  };

  return (
    <div 
      suppressHydrationWarning
      style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, 
        background: 'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, #020205 70%)' 
      }}
    >
      <div 
        className="glass-card" 
        style={{ 
          width: '100%', maxWidth: 420, padding: 40, borderRadius: 32, 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: 16, 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            fontSize:24, fontWeight:800, color:'#fff', margin:'0 auto 20px',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            A
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em', color: '#fff' }}>Access Portal</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>Synchronize with AdFlow Pro Network</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
            borderRadius: 12, padding: '12px 16px', color: '#ef4444', 
            fontSize: 14, marginBottom: 24, textAlign: 'center', fontWeight: 600 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label htmlFor="email" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>Network ID (Email)</label>
            <input 
              id="email" type="email" className="input" placeholder="id@adflow.pro" required 
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} 
              style={{ width: '100%', height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>Access Key (Password)</label>
            <input 
              id="password" type="password" className="input" placeholder="••••••••" required 
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} 
              style={{ width: '100%', height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
            />
          </div>
          
          <button 
            type="submit" disabled={loading} 
            className="btn btn-primary" 
            style={{ 
              width: '100%', height: 54, borderRadius: 100, marginTop: 10,
              fontSize: 16, fontWeight: 800, letterSpacing: '0.02em',
              opacity: loading ? 0.7 : 1, transition: 'all 0.3s'
            }}
          >
            {loading ? 'Initializing...' : 'Authorize Access'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
            New user? <Link href="/register" style={{ color: 'var(--primary-h)', fontWeight: 700, textDecoration: 'none' }}>Create Network Profile</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
