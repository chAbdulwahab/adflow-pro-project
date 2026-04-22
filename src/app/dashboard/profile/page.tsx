'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfileSettingsPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    business_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const token = localStorage.getItem('adflow_token');
    if (!token) return;

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setForm({
            name: data.user.display_name || data.user.name || '',
            phone: data.user.phone || '',
            city: data.user.city || '',
            business_name: data.user.business_name || '',
          });
        }
      })
      .catch(() => setError('Failed to load profile data.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});
    setSuccessMsg('');

    const token = localStorage.getItem('adflow_token');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Profile updated successfully!');
      } else {
        if (data.fields) setErrors(data.fields);
        else setError(data.error || 'Failed to update profile.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (id: keyof typeof form, label: string, type = 'text', placeholder = '', required = true) => (
    <div className="form-group">
      <label htmlFor={id}>{label}{required && ' *'}</label>
      <input 
        id={id} 
        type={type} 
        className="input" 
        placeholder={placeholder} 
        required={required} 
        value={form[id]} 
        onChange={e => setForm({ ...form, [id]: e.target.value })} 
      />
      {errors[id] && <p className="form-error">{errors[id][0]}</p>}
    </div>
  );

  return (
    <div 
      suppressHydrationWarning
      style={{ 
        minHeight: '100vh', padding: '60px 24px', 
        background: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 50%)' 
      }}
    >
      <div className="container" style={{ maxWidth: 600 }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 32, display: 'flex', gap: 8, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Command Center</Link>
          <span style={{ color: 'var(--dim)' }}>/</span>
          <span className="gradient-text">Identity Profile</span>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Identity <span className="gradient-text">Settings</span></h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontWeight: 500 }}>Update your public network credentials and contact information.</p>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Retrieving secure profile data...</p>
          </div>
        ) : (
          <form 
            onSubmit={submit} 
            className="glass-card" 
            style={{ 
              padding: 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            {error && (
              <div style={{ 
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
                borderRadius: 12, padding: '12px 16px', color: '#ef4444', 
                fontSize: 14, marginBottom: 24, textAlign: 'center', fontWeight: 600 
              }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ 
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', 
                borderRadius: 12, padding: '12px 16px', color: '#10b981', 
                fontSize: 14, marginBottom: 24, textAlign: 'center', fontWeight: 600 
              }}>
                {successMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>REAL NAME</label>
                  <input 
                    type="text" className="input" placeholder="John Doe" required 
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} 
                    style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
                  />
                  {errors.name && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.name[0]}</p>}
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>PRIMARY CITY</label>
                  <input 
                    type="text" className="input" placeholder="Lahore" required 
                    value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} 
                    style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>CONTACT FREQUENCY (PHONE)</label>
                <input 
                  type="tel" className="input" placeholder="03001234567" required 
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} 
                  style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, display: 'block' }}>BUSINESS ENTITY (OPTIONAL)</label>
                <input 
                  type="text" className="input" placeholder="Nexus Digital" 
                  value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} 
                  style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}
                />
              </div>

              <button 
                type="submit" disabled={saving} 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', height: 56, borderRadius: 100, marginTop: 12,
                  fontSize: 16, fontWeight: 800, letterSpacing: '0.02em',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Transmitting Changes...' : 'Update Identity Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
