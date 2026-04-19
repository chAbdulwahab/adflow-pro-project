'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Option { id: string; name: string; price?: number; duration_days?: number; }

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams();
  const adId   = params.id as string;

  const [form,       setForm]       = useState({ title: '', description: '', price: '', category_id: '', city_name: '', package_id: '', media_urls: '' });
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities,     setCities]     = useState<Option[]>([]);
  const [packages,   setPackages]   = useState<Option[]>([]);
  const [errors,     setErrors]     = useState<Record<string, string[]>>({});
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adStatus,   setAdStatus]   = useState('');

  // Load meta dropdowns + existing ad data in parallel
  useEffect(() => {
    const token = localStorage.getItem('adflow_token');
    if (!token) { router.push('/login'); return; }

    Promise.all([
      fetch('/api/public/meta').then(r => r.json()),
      fetch(`/api/ads/${adId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([meta, adRes]) => {
      if (meta.success) {
        setCategories(meta.categories);
        setCities(meta.cities);
        setPackages(meta.packages);
      }
      if (adRes.success) {
        const { ad } = adRes;
        setAdStatus(ad.status);

        if (ad.status !== 'draft' && ad.status !== 'rejected') {
          setError(`This ad is in '${ad.status}' status and cannot be edited.`);
          setLoading(false);
          return;
        }

        // Pre-fill form
        const mediaLines = ad.media?.map((m: { original_url: string }) => m.original_url).join('\n') ?? '';
        setForm({
          title:       ad.title       ?? '',
          description: ad.description ?? '',
          price:       ad.price != null ? String(ad.price) : '',
          category_id: ad.category_id ?? '',
          city_name:   ad.city_name   ?? '',
          package_id:  ad.package_id  ?? '',
          media_urls:  mediaLines,
        });
      } else {
        setError(adRes.error ?? 'Failed to load ad');
      }
    }).catch(() => setError('Network error')).finally(() => setLoading(false));
  }, [adId, router]);

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
    setError(''); setErrors({}); setSaving(true);
    const token = localStorage.getItem('adflow_token');

    const mediaUrls = form.media_urls.split('\n').map(u => u.trim()).filter(Boolean);

    try {
      const res  = await fetch(`/api/ads/${adId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: form.price ? parseFloat(form.price) : null, media_urls: mediaUrls }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.fields) setErrors(data.fields);
        else setError(data.error ?? 'Failed to update ad');
        return;
      }
      router.push('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally   { setSaving(false); }
  };

  const selectedPkg = packages.find(p => p.id === form.package_id);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (error && !form.title) return (
    <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
      <p style={{ color: '#f87171', fontSize: 16 }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to Dashboard</button>
    </div>
  );

  return (
    <div className="container" style={{ padding: '48px 24px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Edit <span className="gradient-text">Ad</span></h1>
        {adStatus === 'rejected' && (
          <span className="badge badge-rejected" style={{ marginLeft: 4 }}>Rejected — will reset to Draft on save</span>
        )}
      </div>
      <p style={{ color: '#64748b', marginBottom: 32, paddingLeft: 32 }}>Update your ad details. Media will be replaced with the new URLs you provide.</p>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', marginBottom: 20 }}>{error}</div>}

      <form onSubmit={submit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Ad Title *</label>
          <input id="title" className="input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
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
          <textarea id="desc" className="textarea" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ minHeight: 140 }} />
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
              list="city-options-edit"
              placeholder="e.g. Lahore, Karachi, or type your own…" 
              required 
              value={form.city_name} 
              onChange={e => setForm({...form, city_name: e.target.value})} 
            />
            <datalist id="city-options-edit">
              {cities.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            {errors.city_name && <p className="form-error">{errors.city_name[0]}</p>}
          </div>
        </div>

        {/* Package */}
        <div className="form-group">
          <label>Listing Package *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
            {packages.map(pkg => (
              <div key={pkg.id} onClick={() => setForm({...form, package_id: pkg.id})}
                style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${form.package_id === pkg.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: form.package_id === pkg.id ? 'rgba(99,102,241,0.1)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <p style={{ fontWeight: 700, marginBottom: 2, color: form.package_id === pkg.id ? '#818cf8' : '#e2e8f0' }}>{pkg.name}</p>
                <p style={{ color: '#64748b', fontSize: 12 }}>{pkg.duration_days} days</p>
                <p style={{ color: form.package_id === pkg.id ? '#818cf8' : '#94a3b8', fontWeight: 700, marginTop: 6 }}>PKR {pkg.price?.toLocaleString()}</p>
              </div>
            ))}
          </div>
          {errors.package_id && <p className="form-error">{errors.package_id[0]}</p>}
        </div>

        {/* Media — pre-filled with existing URLs */}
        <div className="form-group">
          <label htmlFor="media">Media URLs * (one per line)</label>
          <textarea id="media" className="textarea" placeholder={`https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://res.cloudinary.com/demo/image/upload/sample.jpg`} required value={form.media_urls} onChange={e => setForm({...form, media_urls: e.target.value})} style={{ minHeight: 110, fontFamily: 'monospace', fontSize: 13 }} />
          {errors.media_urls && <p className="form-error">{errors.media_urls[0]}</p>}
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(56,189,248,0.06)', borderRadius: 8, border: '1px solid rgba(56,189,248,0.15)' }}>
            <p style={{ color: '#38bdf8', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>✅ Accepted formats:</p>
            <p style={{ color: '#64748b', fontSize: 12 }}>• YouTube: <code style={{ color: '#94a3b8' }}>https://youtube.com/watch?v=...</code></p>
            <p style={{ color: '#64748b', fontSize: 12 }}>• Cloudinary: <code style={{ color: '#94a3b8' }}>https://res.cloudinary.com/...</code></p>
            <p style={{ color: '#64748b', fontSize: 12 }}>• Direct image: <code style={{ color: '#94a3b8' }}>https://example.com/photo.jpg</code></p>
            <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>❌ Not accepted: base64 (data:image/...), file paths, Google Drive/Dropbox links</p>
          </div>
        </div>

        {/* Package summary */}
        {selectedPkg && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ color: '#818cf8', fontWeight: 600 }}>📦 {selectedPkg.name} — PKR {selectedPkg.price?.toLocaleString()} for {selectedPkg.duration_days} days</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ flex: 2, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
