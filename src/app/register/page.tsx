'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', phone: '', city: '', business_name: '' });
  const [errors,  setErrors]  = useState<Record<string, string[]>>({});
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setErrors({}); setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) {
        if (data.fields) setErrors(data.fields);
        else setError(data.error ?? 'Registration failed');
        return;
      }
      localStorage.setItem('adflow_token', data.token);
      router.push('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  };

  const field = (id: keyof typeof form, label: string, type = 'text', placeholder = '', required = true) => (
    <div className="form-group">
      <label htmlFor={id}>{label}{required && ' *'}</label>
      <input id={id} type={type} className="input" placeholder={placeholder} required={required} value={form[id]} onChange={e => setForm({ ...form, [id]: e.target.value })} />
      {errors[id] && <p className="form-error">{errors[id][0]}</p>}
    </div>
  );

  return (
    <div 
      suppressHydrationWarning
      style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: "60px 24px", 
        background: 'radial-gradient(circle at center, rgba(14,165,233,0.1) 0%, #020205 70%)' 
      }}
    >
      <div 
        className="glass-card" 
        style={{ 
          width: '100%', maxWidth: 540, padding: 40, borderRadius: 32, 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: 16, 
            background: 'linear-gradient(135deg, var(--secondary), var(--primary))', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            fontSize:24, fontWeight:800, color:'#fff', margin:'0 auto 20px',
            boxShadow: '0 0 20px var(--secondary-glow)'
          }}>
            A
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em', color: '#fff' }}>Initialize Profile</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>Join the elite AdFlow Pro marketplace network</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>FULL NAME</label>
              <input 
                type="text" className="input" placeholder="John Doe" required 
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} 
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
              />
              {errors.name && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.name[0]}</p>}
            </div>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>EMAIL ADDRESS</label>
              <input 
                type="email" className="input" placeholder="you@example.com" required 
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} 
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
              />
              {errors.email && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.email[0]}</p>}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>PHONE NUMBER</label>
              <input 
                type="tel" className="input" placeholder="03001234567" required 
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} 
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>LOCATION (CITY)</label>
              <input 
                type="text" className="input" placeholder="Lahore" required 
                value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} 
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>BUSINESS NAME (OPTIONAL)</label>
              <input 
                type="text" className="input" placeholder="Nexus Solutions" 
                value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} 
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>SECURE ACCESS KEY</label>
              <input 
                type="password" className="input" placeholder="••••••••" required 
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} 
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
              />
              {errors.password && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.password[0]}</p>}
            </div>
          </div>

          <button 
            type="submit" disabled={loading} 
            className="btn btn-primary" 
            style={{ 
              width: '100%', height: 56, borderRadius: 100, marginTop: 10,
              fontSize: 16, fontWeight: 800, letterSpacing: '0.02em',
              opacity: loading ? 0.7 : 1, transition: 'all 0.3s'
            }}
          >
            {loading ? 'Transmitting Data...' : 'Create Network Profile'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
            Existing member? <Link href="/login" style={{ color: 'var(--primary-h)', fontWeight: 700, textDecoration: 'none' }}>Access Portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
