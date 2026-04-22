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
    <div 
      suppressHydrationWarning
      style={{ 
        minHeight: '100vh', padding: '100px 24px', 
        background: '#020205',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div className="container" style={{ maxWidth: 850, position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 50, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em' }}>SECURE DEPLOYMENT PROTOCOL</span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.04em' }}>Marketplace <span className="gradient-text">Submission</span></h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, fontWeight: 500, maxWidth: 500, margin: '0 auto' }}>Connect your asset to the largest sponsored network in Pakistan.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
            borderRadius: 16, padding: '18px', color: '#ef4444', 
            fontSize: 14, marginBottom: 40, textAlign: 'center', fontWeight: 600 
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          {/* Section 1: Specifications */}
          <div className="glass-card" style={{ padding: 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 800, color: '#fff', boxShadow: '0 0 20px var(--primary-glow)' }}>01</div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Asset Specifications</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', marginBottom: 10, display: 'block', letterSpacing: '0.05em' }}>ADVERTISEMENT TITLE</label>
                <input 
                  id="title" className="input" placeholder="What are you listing today?" required 
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} 
                  style={{ width: '100%', height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.02)', fontSize: 16 }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', display: 'block', letterSpacing: '0.05em' }}>TECHNICAL DESCRIPTION</label>
                  <button 
                    type="button" onClick={generateAI} disabled={generating}
                    style={{ 
                      background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)',
                      padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'}
                  >
                    {generating ? 'ANALYZING...' : '✨ ENHANCE WITH AI'}
                  </button>
                </div>
                <textarea 
                  id="desc" className="textarea" placeholder="Detail condition, features, and specifications..." required 
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} 
                  style={{ minHeight: 180, borderRadius: 14, background: 'rgba(255,255,255,0.02)', fontSize: 15, lineHeight: 1.6 }} 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Logistics */}
          <div className="glass-card" style={{ padding: 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 800, color: '#fff', boxShadow: '0 0 20px var(--secondary-glow)' }}>02</div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Logistics & Valuation</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', marginBottom: 10, display: 'block' }}>TARGET PRICE (PKR)</label>
                <input 
                  type="number" className="input" placeholder="e.g. 500,000" 
                  value={form.price} onChange={e => setForm({...form, price: e.target.value})} 
                  style={{ width: '100%', height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.02)' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', marginBottom: 10, display: 'block' }}>SECTOR CATEGORY</label>
                <select 
                  className="input" required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                  style={{ width: '100%', height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.02)', appearance: 'none' }}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id} style={{ background: '#0a0a16' }}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', marginBottom: 10, display: 'block' }}>NETWORK HUB (CITY)</label>
              <input 
                className="input" list="city-options" placeholder="Select deployment city..." required 
                value={form.city_name} onChange={e => setForm({...form, city_name: e.target.value})} 
                style={{ width: '100%', height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.02)' }}
              />
              <datalist id="city-options">
                {cities.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
          </div>

          {/* Section 3: Visibility */}
          <div className="glass-card" style={{ padding: 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 800, color: '#fff', boxShadow: '0 0 20px var(--accent-glow)' }}>03</div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Visibility Protocol</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {packages.map(pkg => {
                const isActive = form.package_id === pkg.id;
                return (
                  <div 
                    key={pkg.id} onClick={() => setForm({...form, package_id: pkg.id})}
                    style={{ 
                      padding: '28px', borderRadius: 24, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: isActive ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: isActive ? '0 15px 35px rgba(99,102,241,0.15)' : 'none',
                      transform: isActive ? 'scale(1.02)' : 'none'
                    }}
                  >
                    <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: isActive ? '#fff' : 'var(--muted)' }}>{pkg.name}</p>
                    <p style={{ fontSize: 12, color: isActive ? 'var(--primary-h)' : 'var(--dim)', fontWeight: 700, letterSpacing: '0.05em' }}>{pkg.duration_days} DAYS PROTOCOL</p>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
                    <p style={{ fontSize: 22, fontWeight: 800, color: isActive ? 'var(--primary-h)' : '#fff' }}>PKR {pkg.price?.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Assets */}
          <div className="glass-card" style={{ padding: 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 800, color: '#000' }}>04</div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Media Repository</h3>
            </div>
            <textarea 
              className="textarea" placeholder="YouTube, Cloudinary, or Direct Image URLs (one per line)..." required 
              value={form.media_urls} onChange={e => setForm({...form, media_urls: e.target.value})} 
              style={{ minHeight: 140, borderRadius: 14, background: 'rgba(255,255,255,0.02)', fontFamily: 'monospace', fontSize: 14 }} 
            />
          </div>

          {/* Final Action */}
          <div style={{ textAlign: 'center', padding: '20px 0 60px' }}>
            <button 
              type="submit" disabled={loading} 
              className="btn btn-primary" 
              style={{ 
                width: '100%', maxWidth: '420px', height: 64, borderRadius: 100,
                fontSize: 18, fontWeight: 800, letterSpacing: '0.03em',
                boxShadow: '0 20px 40px var(--primary-glow)',
                animation: loading ? 'pulse 2s infinite' : 'none'
              }}
            >
              {loading ? 'TRANSMITTING...' : 'INITIALIZE SUBMISSION →'}
            </button>
            <p style={{ color: 'var(--dim)', fontSize: 14, marginTop: 20, fontWeight: 500 }}>
              Ad will be saved as draft and synchronized with the moderation network.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
