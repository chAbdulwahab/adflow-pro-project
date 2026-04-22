'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

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
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, padding: '40px 24px', maxWidth: 1200, margin: '0 auto', alignItems: 'start' }}>

      {/* ── Sidebar Filters ──────────────────────────────── */}
      <aside className={`filter-drawer ${isMobileFilterOpen ? 'open' : ''}`}>
        <form onSubmit={applyFilter} className="card" style={{ position: 'sticky', top: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 16 }}>🔍 Filters</p>
            <button type="button" className="btn btn-ghost btn-sm mobile-filter-toggle" style={{ padding: '4px 10px' }} onClick={() => setIsMobileFilterOpen(false)}>✕</button>
          </div>

          <div className="form-group">
            <label>Search</label>
            <input className="input" placeholder="Keywords…" value={filter.q} onChange={e => setFilter({...filter, q: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select className="select" value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})}>
              <option value="">All Categories</option>
              {meta?.categories.filter(c => Number(c.ad_count) > 0).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>City</label>
            <select className="select" value={filter.city} onChange={e => setFilter({...filter, city: e.target.value})}>
              <option value="">All Cities</option>
              {meta?.cities.filter(c => Number(c.ad_count) > 0).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label>Min PKR</label>
              <input className="input" type="number" placeholder="0" value={filter.min_price} onChange={e => setFilter({...filter, min_price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Max PKR</label>
              <input className="input" type="number" placeholder="∞" value={filter.max_price} onChange={e => setFilter({...filter, max_price: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Sort By</label>
            <select className="select" value={filter.sort} onChange={e => setFilter({...filter, sort: e.target.value})}>
              <option value="rank_score">Best Match</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Apply Filters</button>
          <button type="button" className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:8 }}
            onClick={() => { setFilter({ q:'', category:'', city:'', min_price:'', max_price:'', sort:'rank_score' }); setPage(1); }}>
            Clear All
          </button>
        </form>
      </aside>

      {/* ── Results ─────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>{loading ? 'Loading…' : `${total} listing${total !== 1 ? 's' : ''} found`}</p>
          <button className="btn btn-ghost btn-sm mobile-filter-toggle" onClick={() => setIsMobileFilterOpen(true)}>
            ☰ Filters
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner" /></div>
        ) : ads.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:60 }}>
            <p style={{ fontSize:36, marginBottom:12 }}>🔍</p>
            <p style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>No ads found</p>
            <p style={{ color:'#64748b' }}>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {ads.map(ad => (
              <Link key={ad.id} href={`/ads/${ad.slug}`} className="card card-hover" style={{ padding:0, overflow:'hidden', display:'block' }}>
                <div style={{ height:170, background: ad.thumbnail ? `url(${ad.thumbnail}) center/cover` : 'linear-gradient(135deg,#1e1b4b,#0f172a)', position:'relative' }}>
                  {ad.is_featured && <span className="badge badge-featured" style={{ position:'absolute', top:10, left:10 }}>⭐ Featured</span>}
                  <span className="badge badge-draft" style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.6)', color:'#94a3b8' }}>{ad.package_name}</span>
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <p style={{ fontWeight:600, fontSize:14, marginBottom:6, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ad.title}</p>
                  <p style={{ color:'#818cf8', fontWeight:700, fontSize:15, marginBottom:6 }}>{ad.price ? `PKR ${Number(ad.price).toLocaleString()}` : 'Contact Seller'}</p>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#64748b', fontSize:12 }}>📍 {ad.city_name}</span>
                    <span style={{ color:'#475569', fontSize:12 }}>{ad.category_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="btn btn-ghost btn-sm" style={{ opacity: page===1?0.4:1 }}>← Prev</button>
            <span style={{ padding:'7px 14px', color:'#94a3b8', fontSize:13 }}>Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p+1)} className="btn btn-ghost btn-sm" style={{ opacity: page===pages?0.4:1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
