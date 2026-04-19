'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface AdInfo {
  id: string; title: string; status: string; price: number | null;
  package_name: string; category_name: string; city_name: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const adId   = params.id as string;

  const [ad,       setAd]       = useState<AdInfo | null>(null);
  const [amount,   setAmount]   = useState(0);
  const [form,     setForm]     = useState({ method: 'bank_transfer', transaction_ref: '', sender_name: '', screenshot_url: '' });
  const [errors,   setErrors]   = useState<Record<string, string[]>>({});
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adflow_token');
    if (!token) { router.push('/login'); return; }

    // Fetch ad + package price info
    Promise.all([
      fetch(`/api/ads/${adId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/public/meta').then(r => r.json())
    ]).then(([adRes, metaRes]) => {
      if (adRes.success && metaRes.success) {
        if (adRes.ad.status !== 'payment_pending') {
          setError(`Payment not required. Ad is currently in '${adRes.ad.status}' status.`);
          setLoading(false); return;
        }
        setAd(adRes.ad);
        const pkg = metaRes.packages.find((p: any) => p.id === adRes.ad.package_id);
        if (pkg) setAmount(pkg.price);
      } else {
        setError('Failed to load ad details');
      }
    }).catch(() => setError('Network error')).finally(() => setLoading(false));
  }, [adId, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setErrors({}); setSaving(true);
    const token = localStorage.getItem('adflow_token');

    try {
      const res = await fetch(`/api/ads/${adId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.fields) setErrors(data.fields);
        else setError(data.error ?? 'Failed to submit payment');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch { setError('Network error. Please try again.'); }
    finally   { setSaving(false); }
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  if (error && !ad) return (
    <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
      <p style={{ color: '#f87171', fontSize: 16 }}>{error}</p>
      <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to Dashboard</Link>
    </div>
  );

  if (done) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div className="card" style={{ maxWidth: 420 }}>
        <p style={{ fontSize: 50, marginBottom: 12 }}>🧾</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#22c55e' }}>Payment Submitted!</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Your payment is now awaiting verification from our team. Once verified, your ad will go live automatically.</p>
        <p style={{ color: '#64748b', fontSize: 13 }}>Redirecting to dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '48px 24px', maxWidth: 800 }}>
      <Link href="/dashboard" style={{ color: '#64748b', fontSize: 14, display: 'inline-block', marginBottom: 24 }}>← Back to Dashboard</Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(280px, 340px)', gap: 32, alignItems: 'start' }}>
        
        {/* Left: Payment Form */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Submit <span className="gradient-text">Payment</span></h1>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Transfer the required amount and submit the transaction details below.</p>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', marginBottom: 20 }}>{error}</div>}

          <form onSubmit={submit}>
            {/* Payment Method selector */}
            <div className="form-group">
              <label>Payment Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {([
                  { id: 'bank_transfer', label: '🏦 Bank Transfer' },
                  { id: 'jazzcash',      label: '📱 JazzCash' },
                  { id: 'easypaisa',     label: '📱 EasyPaisa' }
                ]).map(m => (
                  <button type="button" key={m.id} onClick={() => setForm({...form, method: m.id})}
                    style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${form.method === m.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: form.method === m.id ? 'rgba(99,102,241,0.1)' : 'var(--surface)', color: form.method === m.id ? '#818cf8' : '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Sender Account Name *</label>
                <input required className="input" placeholder="e.g. John Doe" value={form.sender_name} onChange={e => setForm({...form, sender_name: e.target.value})} />
                {errors.sender_name && <p className="form-error">{errors.sender_name[0]}</p>}
              </div>
              <div className="form-group">
                <label>Transaction Ref / TID *</label>
                <input required className="input" placeholder="e.g. 0123456789" value={form.transaction_ref} onChange={e => setForm({...form, transaction_ref: e.target.value})} />
                {errors.transaction_ref && <p className="form-error">{errors.transaction_ref[0]}</p>}
              </div>
            </div>

            <div className="form-group">
              <label>Screenshot URL (Optional)</label>
              <input type="url" className="input" placeholder="https://res.cloudinary.com/..." value={form.screenshot_url} onChange={e => setForm({...form, screenshot_url: e.target.value})} />
              {errors.screenshot_url && <p className="form-error">{errors.screenshot_url[0]}</p>}
              <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>A link to an image of your payment receipt.</p>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', opacity: saving ? 0.7 : 1, marginTop: 12 }}>
              {saving ? 'Submitting…' : 'Confirm Payment'}
            </button>
          </form>
        </div>

        {/* Right: Ad Summary & Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ color: '#818cf8', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Amount Due</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>PKR {amount.toLocaleString()}</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>For <strong>{ad?.package_name}</strong> listing</p>
          </div>

          <div className="card">
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Ad Information</p>
            <p style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{ad?.title}</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>{ad?.category_name} · 📍{ad?.city_name}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <span className="badge badge-pending">Payment Pending</span>
              <span className="badge badge-featured">{ad?.package_name}</span>
            </div>
          </div>

          <div className="card">
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Transfer Details</p>
            {form.method === 'bank_transfer' && (
              <div style={{ fontSize: 14, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Bank:</span> <span>HBL Pakistan</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Title:</span> <span>AdFlow Pro</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>IBAN:</span> <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>PK34HABB0000123456789</span></div>
              </div>
            )}
            {form.method === 'jazzcash' && (
              <div style={{ fontSize: 14, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Network:</span> <span>JazzCash</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Title:</span> <span>AdFlow Pvt Ltd</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Number:</span> <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>0300-1234567</span></div>
              </div>
            )}
            {form.method === 'easypaisa' && (
              <div style={{ fontSize: 14, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Network:</span> <span>EasyPaisa</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Title:</span> <span>AdFlow</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Number:</span> <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>0345-7654321</span></div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
