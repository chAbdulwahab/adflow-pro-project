'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Ad { id: string; title: string; slug: string; price: number | null; city_name: string; thumbnail: string | null; is_featured: boolean; }
interface Meta { stats: { live_ads: number; featured_ads: number; active_cities: number }; categories: { name: string; slug: string; ad_count: string }[]; }

export default function HomePage() {
  const [featured, setFeatured] = useState<Ad[]>([]);
  const [recent, setRecent]     = useState<Ad[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [query, setQuery]       = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adflow_token')) {
      setIsLoggedIn(true);
    }
    fetch('/api/public/meta').then(r => r.json()).then(r => r.success && setMeta(r));
    fetch('/api/public/ads?featured=true&limit=6&sort=rank_score')
      .then(r => r.json()).then(r => r.success && setFeatured(r.ads));
    fetch('/api/public/ads?limit=4&sort=newest')
      .then(r => r.json()).then(r => r.success && setRecent(r.ads));
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/explore?q=${encodeURIComponent(query)}`;
  };

  const adGrid = (ads: Ad[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
      {ads.map(ad => (
        <Link key={ad.id} href={`/ads/${ad.slug}`} className="card card-hover" style={{ overflow: 'hidden', padding: 0, display: 'block' }}>
          <div style={{ height: 180, background: ad.thumbnail ? `url(${ad.thumbnail}) center/cover` : 'linear-gradient(135deg,#1e1b4b,#312e81)', position: 'relative' }}>
            {ad.is_featured && <span className="badge badge-featured" style={{ position: 'absolute', top: 10, left: 10 }}>⭐ Featured</span>}
          </div>
          <div style={{ padding: '16px 18px' }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#818cf8', fontWeight: 700, fontSize: 16 }}>{ad.price ? `PKR ${ad.price.toLocaleString()}` : 'Contact'}</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>📍 {ad.city_name}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-bg" style={{ padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            🚀 Pakistan's #1 Sponsored Listings Platform
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            <span className="gradient-text">Advertise Smarter,</span><br />Reach Further
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
            Post, manage, and grow your listings with AdFlow Pro's powerful moderation pipeline, verified payments, and intelligent ranking.
          </p>

          {/* Search */}
          <form onSubmit={search} style={{ display: 'flex', gap: 10, maxWidth: 560, margin: '0 auto 48px' }}>
            <input
              className="input"
              style={{ flex: 1, fontSize: 15, padding: '14px 18px', borderRadius: 14 }}
              placeholder="Search listings (e.g. iPhone, car, apartment)…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-lg" style={{ borderRadius: 14, whiteSpace: 'nowrap' }}>Search</button>
          </form>

          {/* Stats */}
          {meta && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap' }}>
              {[
                { label: 'Live Ads',     value: meta.stats.live_ads },
                { label: 'Featured Ads', value: meta.stats.featured_ads },
                { label: 'Cities',       value: meta.stats.active_cities },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>{s.value.toLocaleString()}</p>
                  <p style={{ color: '#64748b', fontSize: 13 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {meta && (
        <section style={{ padding: '60px 24px' }}>
          <div className="container">
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Browse Categories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {meta.categories.map(cat => (
                <Link key={cat.slug} href={`/explore?category=${cat.slug}`}
                  className="card card-hover"
                  style={{ textAlign: 'center', padding: '20px 16px' }}
                >
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{cat.name}</p>
                  <p style={{ color: '#64748b', fontSize: 12 }}>{cat.ad_count} ads</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Ads ─────────────────────────────────────── */}
      <section style={{ padding: '20px 24px 40px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>⭐ Featured Listings</h2>
            <Link href="/explore?featured=true" style={{ color: '#818cf8', fontSize: 14, fontWeight: 600 }}>View all →</Link>
          </div>
          {featured.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              No live featured ads yet. 
              {isLoggedIn ? (
                <Link href="/ads/new" style={{ color: '#818cf8', marginLeft: 4 }}>Be the first to post one!</Link>
              ) : (
                <Link href="/register" style={{ color: '#818cf8', marginLeft: 4 }}>Create an account to post one!</Link>
              )}
            </div>
          ) : adGrid(featured)}
        </div>
      </section>

      {/* ── Recent Ads ───────────────────────────────────────── */}
      {recent.length > 0 && (
        <section style={{ padding: '20px 24px 80px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>🕒 Most Recent</h2>
              <Link href="/explore?sort=newest" style={{ color: '#818cf8', fontSize: 14, fontWeight: 600 }}>Browse all →</Link>
            </div>
            {adGrid(recent)}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', background: 'rgba(99,102,241,0.06)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          {isLoggedIn ? (
            <>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to post your next ad?</h2>
              <p style={{ color: '#94a3b8', marginBottom: 28 }}>Manage your listings or create a new one to reach more buyers.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/ads/new" className="btn btn-primary btn-lg">Post an Ad</Link>
                <Link href="/dashboard" className="btn btn-ghost btn-lg">Go to Dashboard</Link>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to reach more buyers?</h2>
              <p style={{ color: '#94a3b8', marginBottom: 28 }}>Join thousands of sellers using AdFlow Pro to grow their business.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
                <Link href="/explore" className="btn btn-ghost btn-lg">Browse Listings</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
