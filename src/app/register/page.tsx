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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: "40px 24px", background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', margin:'0 auto 16px' }}>A</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Join thousands of sellers today.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('name',     'Full Name',    'text',     'John Doe')}
            {field('email',    'Email',        'email',    'you@example.com')}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('phone',    'Phone Number', 'tel',      '03001234567')}
            {field('city',     'City',         'text',     'Lahore')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {field('business_name', 'Business Name', 'text', 'My Awesome Store', false)}
            {field('password', 'Password',     'password', '6+ characters')}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 24 }}>
          Already have an account? <Link href="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
