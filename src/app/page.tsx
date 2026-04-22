'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
      {ads.map((ad, idx) => (
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
        >
          <Link href={`/ads/${ad.slug}`} className="glass-card" style={{ overflow: 'hidden', padding: 0, display: 'block', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ height: 200, background: ad.thumbnail ? `url(${ad.thumbnail}) center/cover` : 'linear-gradient(135deg,#0a0a16,#1e1b4b)', position: 'relative' }}>
              {ad.is_featured && <span className="badge" style={{ position: 'absolute', top: 12, left: 12, background: 'var(--accent)', color: '#fff', border: 'none' }}>⭐ Featured</span>}
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary-h)', fontWeight: 800, fontSize: 18 }}>{ad.price ? `PKR ${ad.price.toLocaleString()}` : 'Contact'}</span>
                <span style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ opacity: 0.7 }}>📍</span> {ad.city_name}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--primary-h)', fontSize: 14, fontWeight: 700, marginBottom: 32 }}
          >
            <span className="pulse" style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />
            Pakistan's Most Advanced Ad Marketplace
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.04em' }}
          >
            Future of <span className="gradient-text">Advertising</span> <br />
            is Finally Here.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ color: 'var(--muted)', fontSize: 20, lineHeight: 1.6, marginBottom: 48, maxWidth: 640, margin: '0 auto 48px' }}
          >
            Experience lightning-fast listing management, AI-powered ranking, and secure transactions in Pakistan's premium ad ecosystem.
          </motion.p>

          {/* Search */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            onSubmit={search} 
            style={{ display: 'flex', gap: 12, maxWidth: 640, margin: '0 auto 64px', position: 'relative', zIndex: 10 }}
          >
            <input
              className="input glass"
              style={{ flex: 1, fontSize: 16, padding: '16px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="What are you looking for today?..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 18, padding: '0 32px' }}>Search</button>
          </motion.form>

          {/* Stats */}
          {meta && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}
            >
              {[
                { label: 'Verified Ads',     value: meta.stats.live_ads },
                { label: 'Featured Sellers', value: meta.stats.featured_ads },
                { label: 'Active Regions',   value: meta.stats.active_cities },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{s.value.toLocaleString()}</p>
                  <p style={{ color: 'var(--dim)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {meta && (
        <section style={{ padding: '80px 24px' }}>
          <div className="container">
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Explore <span className="gradient-text">Categories</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {meta.categories.map((cat, idx) => (
                <motion.div key={cat.slug} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} viewport={{ once: true }}>
                  <Link href={`/explore?category=${cat.slug}`}
                    className="glass-card"
                    style={{ textAlign: 'center', padding: '24px 16px', display: 'block' }}
                  >
                    <p style={{ fontWeight: 700, marginBottom: 4, color: '#fff' }}>{cat.name}</p>
                    <p style={{ color: 'var(--dim)', fontSize: 12 }}>{cat.ad_count} Active Ads</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Ads ─────────────────────────────────────── */}
      <section style={{ padding: '60px 24px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Featured <span style={{ color: 'var(--accent)' }}>Listings</span></h2>
              <p style={{ color: 'var(--muted)' }}>Handpicked premium ads for you.</p>
            </div>
            <Link href="/explore?featured=true" style={{ color: 'var(--primary-h)', fontSize: 15, fontWeight: 700, paddingBottom: 8 }}>View all →</Link>
          </div>
          {featured.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 64, color: 'var(--muted)' }}>
              No featured ads live right now.
              <br />
              <Link href="/ads/new" style={{ color: 'var(--primary-h)', fontWeight: 700, marginTop: 12, display: 'inline-block' }}>Be the first to feature yours!</Link>
            </div>
          ) : adGrid(featured)}
        </div>
      </section>

      {/* ── Recent Ads ───────────────────────────────────────── */}
      {recent.length > 0 && (
        <section style={{ padding: '60px 24px 120px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800 }}>Recent <span style={{ color: 'var(--secondary)' }}>Activity</span></h2>
              <Link href="/explore?sort=newest" style={{ color: 'var(--primary-h)', fontSize: 15, fontWeight: 700 }}>Browse all →</Link>
            </div>
            {adGrid(recent)}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)', zIndex: -1 }} />
        <div className="container" style={{ textAlign: 'center', maxWidth: 800 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass" style={{ padding: '64px 40px', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16 }}>Ready to <span className="gradient-text">scale</span> your reach?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>Join the next generation of sellers and start listing your products on Pakistan's most advanced platform.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={isLoggedIn ? "/ads/new" : "/register"} className="btn btn-primary btn-lg" style={{ minWidth: 200 }}>{isLoggedIn ? "Post New Ad" : "Get Started Now"}</Link>
              <Link href="/explore" className="btn btn-ghost btn-lg" style={{ minWidth: 200 }}>Browse Marketplace</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

