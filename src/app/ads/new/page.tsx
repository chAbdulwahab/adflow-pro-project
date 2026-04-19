'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Option { id: string; name: string; slug?: string; price?: number; duration_days?: number; }

export default function PostAdPage() {
  const router = useRouter();
  const [form,       setForm]       = useState({ title: '', description: '', price: '', category_id: '', city_name: '', package_id: '', media_urls: '' });
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities,     setCities]     = useState<Option[]>([]);
  const [packages,   setPackages]   = useState<Option[]>([]);
  const [errors,     setErrors]     = useState<Record<string, string[]>>({});
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/public/meta').then(r => r.json()).then(r => {
      if (r.success) { setCategories(r.categories); setCities(r.cities); setPackages(r.packages); }
    });
  }, []);

  const generateAI = async () => {
    if (!form.title || form.title.length < 3) {
      alert('Please enter a descriptive Ad Title first.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title })
      });
      const data = await res.json();
      if (data.success) {
        setForm({ ...form, description: data.description });
      } else {
        alert(data.error || 'Failed to generate');
      }
    } catch {
      alert('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setErrors({}); setLoading(true);
    const token = localStorage.getItem('adflow_token');
    if (!token) { router.push('/login'); return; }

    const mediaUrls = form.media_urls.split('\n').map(u => u.trim()).filter(Boolean);

    try {
      const res  = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: form.price ? parseFloat(form.price) : null, media_urls: mediaUrls }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.fields) setErrors(data.fields);
        else setError(data.error ?? 'Failed to create ad');
        return;
      }
      router.push('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  };

  const selectedPkg = packages.find(p => p.id === form.package_id);

  return (
    <div className="container" style={{ padding: '48px 24px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Post a New <span className="gradient-text">Ad</span></h1>
      <p style={{ color: '#64748b', marginBottom: 36 }}>Fill in the details below. Your ad will be reviewed before going live.</p>

      {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', color:'#f87171', marginBottom:20 }}>{error}</div>}

      <form onSubmit={submit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Ad Title *</label>
          <input id="title" className="input" placeholder="e.g. Selling iPhone 15 Pro Max — Karachi" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          {errors.title && <p className="form-error">{errors.title[0]}</p>}
        </div>

        {/* Description */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="desc" style={{ marginBottom: 0 }}>Description *</label>
            <button 
              type="button" 
              onClick={generateAI} 
              disabled={generating}
              style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', padding: '4px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: generating ? 0.7 : 1 }}
            >
              {generating ? '⏳ Generating...' : '✨ Write with AI'}
            </button>
          </div>
          <textarea id="desc" className="textarea" placeholder="Describe your item in detail — condition, specs, what's included…" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ minHeight: 140 }} />
          {errors.description && <p className="form-error">{errors.description[0]}</p>}
        </div>

        {/* Price */}
        <div className="form-group">
          <label htmlFor="price">Price (PKR) — leave blank for "Contact seller"</label>
          <input id="price" type="number" className="input" placeholder="e.g. 250000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
        </div>

        {/* Category + City */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select id="category" className="select" required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="form-error">{errors.category_id[0]}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input 
              id="city" 
              className="input" 
              list="city-options" 
              placeholder="e.g. Lahore, Karachi, or type your own…" 
              required 
              value={form.city_name} 
              onChange={e => setForm({...form, city_name: e.target.value})} 
            />
            <datalist id="city-options">
              {cities.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            {errors.city_name && <p className="form-error">{errors.city_name[0]}</p>}
          </div>
        </div>

        {/* Package */}
        <div className="form-group">
          <label>Listing Package *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {packages.map(pkg => (
              <div key={pkg.id} onClick={() => setForm({...form, package_id: pkg.id})}
                style={{ padding: '16px 18px', borderRadius: 12, border: `2px solid ${form.package_id === pkg.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: form.package_id === pkg.id ? 'rgba(99,102,241,0.1)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: form.package_id === pkg.id ? '#818cf8' : '#e2e8f0' }}>{pkg.name}</p>
                <p style={{ color: '#64748b', fontSize: 13 }}>{pkg.duration_days} days</p>
                <p style={{ color: form.package_id === pkg.id ? '#818cf8' : '#94a3b8', fontWeight: 700, marginTop: 8 }}>PKR {pkg.price?.toLocaleString()}</p>
              </div>
            ))}
          </div>
          {errors.package_id && <p className="form-error">{errors.package_id[0]}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="media">Media URLs * (one per line)</label>
          <textarea id="media" className="textarea" placeholder={`YouTube:\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n\nCloudinary:\nhttps://res.cloudinary.com/demo/image/upload/sample.jpg\n\nDirect image:\nhttps://example.com/photos/car.jpg`} required value={form.media_urls} onChange={e => setForm({...form, media_urls: e.target.value})} style={{ minHeight: 130, fontFamily: 'monospace', fontSize: 13 }} />
          {errors.media_urls && <p className="form-error">{errors.media_urls[0]}</p>}
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(56,189,248,0.06)', borderRadius: 8, border: '1px solid rgba(56,189,248,0.15)' }}>
            <p style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>✅ Accepted formats:</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>• YouTube links — <code style={{ color: '#94a3b8' }}>https://youtube.com/watch?v=...</code></p>
            <p style={{ color: '#64748b', fontSize: 12 }}>• Cloudinary URLs — <code style={{ color: '#94a3b8' }}>https://res.cloudinary.com/...</code></p>
            <p style={{ color: '#64748b', fontSize: 12 }}>• Direct image URLs — ending in <code style={{ color: '#94a3b8' }}>.jpg .png .webp</code></p>
            <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>❌ Not accepted: base64 images (data:image/...), file paths, Google Drive/Dropbox links</p>
          </div>
        </div>

        {/* Summary + Submit */}
        {selectedPkg && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: '#818cf8', fontWeight: 600, marginBottom: 4 }}>📦 {selectedPkg.name} Package Selected</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Your ad will be reviewed, then payment of <strong style={{ color: '#e2e8f0' }}>PKR {selectedPkg.price?.toLocaleString()}</strong> will be required before going live for {selectedPkg.duration_days} days.</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving Ad…' : 'Save as Draft →'}
        </button>
        <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 10 }}>Saved as draft. You can review and submit for moderation from your dashboard.</p>
      </form>
    </div>
  );
}
