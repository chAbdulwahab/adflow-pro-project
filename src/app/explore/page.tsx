'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ad { id: string; title: string; slug: string; price: number | null; is_featured: boolean; category_name: string; city_name: string; city_slug: string; package_name: string; thumbnail: string | null; publish_at: string; }
interface Filter { q: string; category: string; city: string; min_price: string; max_price: string; sort: string; }
interface Meta { categories: { name: string; slug: string; ad_count: string }[]; cities: { name: string; slug: string; ad_count: string }[]; }

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ads,     setAds]     = useState<Ad[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [meta,    setMeta]    = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filter,  setFilter]  = useState<Filter>({
    q:         searchParams.get('q')        ?? '',
    category:  searchParams.get('category') ?? '',
    city:      searchParams.get('city')     ?? '',
    min_price: searchParams.get('min_price') ?? '',
    max_price: searchParams.get('max_price') ?? '',
    sort:      searchParams.get('sort')     ?? 'rank_score',
  });

  useEffect(() => { fetch('/api/public/meta').then(r => r.json()).then(r => r.success && setMeta(r)); }, []);

  const fetchAds = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.q)         params.set('q',         filter.q);
    if (filter.category)  params.set('category',  filter.category);
    if (filter.city)      params.set('city',       filter.city);
    if (filter.min_price) params.set('min_price',  filter.min_price);
    if (filter.max_price) params.set('max_price',  filter.max_price);
    if (filter.sort)      params.set('sort',       filter.sort);
    params.set('page',    String(page));
    params.set('limit',   '12');
    fetch(`/api/public/ads?${params}`)
      .then(r => r.json())
      .then(r => { if (r.success) { setAds(r.ads); setTotal(r.pagination.total); setPages(r.pagination.pages); } })
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const applyFilter = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchAds(); };

  return (
    <div className="explore-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, padding: '40px 24px', maxWidth: 1300, margin: '0 auto', alignItems: 'start' }}>

      {/* ── Sidebar Filters ──────────────────────────────── */}
      <aside className={`explore-sidebar`}>
        <motion.form 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={applyFilter} 
          className="glass-card" 
          style={{ position: 'sticky', top: 120, padding: 24, borderRadius: 'var(--radius-lg)' }}
        >
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Advanced <span className="gradient-text">Filters</span></p>
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--muted)', fontWeight: 600 }}>Keywords</label>
            <input className="input" placeholder="What are you hunting for?…" value={filter.q} onChange={e => setFilter({...filter, q: e.target.value})} />
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--muted)', fontWeight: 600 }}>Category</label>
            <select className="input" value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})}>
              <option value="">All Categories</option>
              {meta?.categories.filter(c => Number(c.ad_count) > 0).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--muted)', fontWeight: 600 }}>Location</label>
            <select className="input" value={filter.city} onChange={e => setFilter({...filter, city: e.target.value})}>
              <option value="">All Cities</option>
              {meta?.cities.filter(c => Number(c.ad_count) > 0).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label style={{ color: 'var(--muted)', fontWeight: 600 }}>Min Price</label>
              <input className="input" type="number" placeholder="0" value={filter.min_price} onChange={e => setFilter({...filter, min_price: e.target.value})} />
            </div>
            <div className="form-group">
              <label style={{ color: 'var(--muted)', fontWeight: 600 }}>Max Price</label>
              <input className="input" type="number" placeholder="Any" value={filter.max_price} onChange={e => setFilter({...filter, max_price: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--muted)', fontWeight: 600 }}>Order By</label>
            <select className="input" value={filter.sort} onChange={e => setFilter({...filter, sort: e.target.value})}>
              <option value="rank_score">Best Match</option>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Refine Search</button>
            <button type="button" className="btn btn-ghost" style={{ width:'100%' }}
              onClick={() => { setFilter({ q:'', category:'', city:'', min_price:'', max_price:'', sort:'rank_score' }); setPage(1); }}>
              Reset Filters
            </button>
          </div>
        </motion.form>
      </aside>

      {/* ── Mobile Filter Drawer ────────────────────────── */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, 
              background: 'rgba(2, 2, 5, 0.95)', 
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              zOrder: 99999, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px', zIndex: 100000
            }}
          >
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onSubmit={(e) => { applyFilter(e); setIsMobileFilterOpen(false); }} 
              className="glass-card" 
              style={{ padding: 32, width: '100%', maxWidth: 400, borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <p style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>Refine <span className="gradient-text">Signal</span></p>
                <button type="button" className="btn btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }} onClick={() => setIsMobileFilterOpen(false)}>✕</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Keywords</label>
                  <input className="input" placeholder="Search parameters…" value={filter.q} onChange={e => setFilter({...filter, q: e.target.value})} style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Category</label>
                    <select className="input" value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})} style={{ width: '100%' }}>
                      <option value="">All Types</option>
                      {meta?.categories.filter(c => Number(c.ad_count) > 0).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Location</label>
                    <select className="input" value={filter.city} onChange={e => setFilter({...filter, city: e.target.value})} style={{ width: '100%' }}>
                      <option value="">All Sectors</option>
                      {meta?.cities.filter(c => Number(c.ad_count) > 0).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Min Credit</label>
                    <input className="input" type="number" placeholder="0" value={filter.min_price} onChange={e => setFilter({...filter, min_price: e.target.value})} style={{ width: '100%' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Max Credit</label>
                    <input className="input" type="number" placeholder="Any" value={filter.max_price} onChange={e => setFilter({...filter, max_price: e.target.value})} style={{ width: '100%' }} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 54, borderRadius: 100, fontSize: 16 }}>Update Feed</button>
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 12, borderRadius: 100 }} onClick={() => { setFilter({ q:'', category:'', city:'', min_price:'', max_price:'', sort:'rank_score' }); setIsMobileFilterOpen(false); }}>Reset All</button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ─────────────────────────────────────── */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
            {loading ? 'Synthesizing results...' : (
              <span>Found <b style={{ color: '#fff' }}>{total}</b> listings</span>
            )}
          </p>
          <button className="btn btn-ghost btn-sm mobile-filter-toggle" onClick={() => setIsMobileFilterOpen(true)}>
            ☰ Filters
          </button>
        </div>


        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display:'flex', justifyContent:'center', padding:100 }}><div className="spinner" /></motion.div>
          ) : ads.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ textAlign:'center', padding:80 }}>
              <p style={{ fontSize:48, marginBottom:16 }}>🛸</p>
              <p style={{ fontSize:24, fontWeight:800, marginBottom:12 }}>Signal Lost</p>
              <p style={{ color:'var(--muted)' }}>No listings detected with these parameters. Try a different sector.</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:24 }}
            >
              {ads.map((ad, idx) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link href={`/ads/${ad.slug}`} className="glass-card" style={{ padding:0, overflow:'hidden', display:'block', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ height:180, background: ad.thumbnail ? `url(${ad.thumbnail}) center/cover` : 'linear-gradient(135deg,#020205,#13132b)', position:'relative' }}>
                      {ad.is_featured && <span className="badge" style={{ position:'absolute', top:12, left:12, background: 'var(--accent)', color: '#fff', border: 'none' }}>⭐ Featured</span>}
                      <span className="badge" style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color:'var(--muted)', border: '1px solid var(--border)' }}>{ad.package_name}</span>
                    </div>
                    <div style={{ padding:'20px' }}>
                      <p style={{ fontWeight:700, fontSize:16, marginBottom:8, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ad.title}</p>
                      <p style={{ color:'var(--primary-h)', fontWeight:800, fontSize:18, marginBottom:8 }}>{ad.price ? `PKR ${Number(ad.price).toLocaleString()}` : 'Contact Seller'}</p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
                        <span style={{ color:'var(--muted)', fontSize:12, fontWeight: 500 }}>📍 {ad.city_name}</span>
                        <span style={{ color:'var(--dim)', fontSize:11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ad.category_name}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div style={{ display:'flex', justifyContent:'center', alignItems: 'center', gap:16, marginTop:48 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="btn btn-ghost" style={{ opacity: page===1?0.3:1 }}>← Previous</button>
            <span style={{ padding:'8px 16px', color:'var(--muted)', fontSize:14, fontWeight: 600, background: 'var(--surface)', borderRadius: 10 }}>Sector {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p+1)} className="btn btn-ghost" style={{ opacity: page===pages?0.3:1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', padding:100 }}><div className="spinner" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}

