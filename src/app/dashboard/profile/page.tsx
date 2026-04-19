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
    <div className="container" style={{ padding: '40px 24px', maxWidth: 640 }}>
      <div style={{ marginBottom: 24, display: 'flex', gap: 6, fontSize: 13, color: '#64748b', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: '#64748b' }}>Dashboard</Link>
        <span>›</span>
        <span style={{ color: '#94a3b8' }}>Profile Settings</span>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Profile <span className="gradient-text">Settings</span></h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Update your seller contact information. This will be shown on your live ads.</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <form onSubmit={submit} className="card">
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</div>}
          {successMsg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 14px', color: '#22c55e', fontSize: 14, marginBottom: 16 }}>{successMsg}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {field('name', 'Full Name', 'text', 'John Doe')}
            {field('phone', 'Phone Number', 'tel', '03001234567')}
            {field('city', 'City', 'text', 'Lahore')}
            {field('business_name', 'Business Name', 'text', 'My Awesome Store', false)}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
