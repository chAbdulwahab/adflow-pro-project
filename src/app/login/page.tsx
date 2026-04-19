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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', margin:'0 auto 16px' }}>A</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Sign in to your AdFlow Pro account</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@example.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input" placeholder="••••••••" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 24 }}>
          Don't have an account? <Link href="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Create one free</Link>
        </p>

        {/* Quick test credentials */}
        <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#475569', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Test Credentials</p>
          {[
            { label: 'Client',     email: 'abdul@test.com',     pw: '(your password)' },
            { label: 'Admin',      email: 'admin@test.com',     pw: 'Admin@123' },
            { label: 'Moderator',  email: 'moderator@test.com', pw: 'Moderator@123' },
          ].map(c => (
            <div key={c.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ color:'#64748b', fontSize:12 }}>{c.label}:</span>
              <span style={{ color:'#94a3b8', fontSize:12, fontFamily:'monospace' }}>{c.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
