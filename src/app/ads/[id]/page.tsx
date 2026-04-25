'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Media {
  source_type: 'image' | 'youtube' | 'cloudinary';
  original_url: string;
  normalized_thumbnail_url: string;
  display_order: number;
}

interface Ad {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  price: number | null;
  is_featured: boolean;
  publish_at: string;
  expire_at: string;
  category_name: string;
  category_slug: string;
  city_name: string;
  city_slug: string;
  package_name: string;
  owner_name: string;
  seller_display_name: string | null;
  seller_business_name: string | null;
  seller_phone: string | null;
  seller_city: string | null;
  seller_verified: boolean;
  media: Media[];
}

interface RelatedAd {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  is_featured: boolean;
  city_name: string;
  thumbnail: string | null;
}

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function AdDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = params.id as string; // the [id] segment holds the slug

  const [ad,        setAd]        = useState<Ad | null>(null);
  const [related,   setRelated]   = useState<RelatedAd[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [user,      setUser]      = useState<{ id: string, role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adflow_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch { setUser(null); }
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/ads/${slug}`)
      .then(r => r.json())
      .then(r => {
        if (r.success) {
          setAd(r.ad);
          setRelated(r.related_ads ?? []);
          // Fire view tracking (fire-and-forget — errors are intentionally swallowed)
          const token = localStorage.getItem('adflow_token');
          fetch(`/api/ads/${r.ad.id}/view`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).catch(() => {});
        } else {
          setError(r.error ?? 'Ad not found');
        }
      })
      .catch(() => setError('Failed to load ad'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!ad || !confirm('Are you sure you want to delete this ad? This action cannot be undone.')) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Ad deleted successfully');
        router.push('/explore');
      } else {
        alert(data.error || 'Failed to delete ad');
      }
    } catch (err) {
      alert('Network error while deleting ad');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (error || !ad) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>🔍</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Ad Not Found</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          {error || 'This ad may have expired or been removed.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => router.back()} className="btn btn-ghost">← Go Back</button>
          <Link href="/explore" className="btn btn-primary">Browse Listings</Link>
        </div>
      </div>
    </div>
  );

  const activeMedia = ad.media[activeIdx];
  const daysLeft    = ad.expire_at
    ? Math.max(0, Math.ceil((new Date(ad.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, fontSize: 13, color: '#64748b' }}>
        <Link href="/" style={{ color: '#64748b' }}>Home</Link>
        <span>›</span>
        <Link href="/explore" style={{ color: '#64748b' }}>Explore</Link>
        <span>›</span>
        <Link href={`/explore?category=${ad.category_slug}`} style={{ color: '#64748b' }}>{ad.category_name}</Link>
        <span>›</span>
        <span style={{ color: '#94a3b8' }}>{ad.title.slice(0, 40)}{ad.title.length > 40 ? '…' : ''}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

        {/* ── Left column ────────────────────────────────────────────── */}
        <div>
          {/* Media player */}
          {ad.media.length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              {/* Main media */}
              <div style={{
                borderRadius: 16, overflow: 'hidden', background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10,
                aspectRatio: '16/9', position: 'relative',
              }}>
                {activeMedia?.source_type === 'youtube' ? (
                  <iframe
                    src={getYoutubeEmbedUrl(activeMedia.original_url) ?? ''}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={activeMedia?.normalized_thumbnail_url || activeMedia?.original_url}
                    alt={ad.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"%3E%3Crect fill="%230f172a" width="400" height="225"/%3E%3Ctext fill="%2364748b" font-size="16" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo preview%3C/text%3E%3C/svg%3E'; }}
                  />
                )}
                {ad.is_featured && (
                  <span className="badge badge-featured" style={{ position: 'absolute', top: 12, left: 12 }}>
                    ⭐ Featured
                  </span>
                )}
              </div>

              {/* Thumbnails strip */}
              {ad.media.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ad.media.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      style={{
                        width: 72, height: 48, padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden',
                        outline: i === activeIdx ? '2px solid #6366f1' : '2px solid transparent',
                        cursor: 'pointer', flexShrink: 0, transition: 'outline 0.15s',
                      }}
                    >
                      <img
                        src={m.normalized_thumbnail_url}
                        alt={`Media ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: 260, borderRadius: 16, background: 'linear-gradient(135deg,#1e1b4b,#0f172a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ color: '#475569', fontSize: 14 }}>No media available</span>
            </div>
          )}

          {/* Title + meta */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-published">● Live</span>
              <span className="badge badge-draft" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                {ad.package_name}
              </span>
              {ad.is_featured && <span className="badge badge-featured">⭐ Featured</span>}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 10 }}>{ad.title}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: '#64748b', fontSize: 13 }}>
              <span>📂 <Link href={`/explore?category=${ad.category_slug}`} style={{ color: '#818cf8' }}>{ad.category_name}</Link></span>
              <span>📍 <Link href={`/explore?city=${ad.city_slug}`} style={{ color: '#818cf8' }}>{ad.city_name}</Link></span>
              {daysLeft !== null && <span>⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>}
            </div>
          </div>

          {/* Description */}
          <div className="card" style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, marginBottom: 12, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</p>
            <p style={{ color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: 15 }}>{ad.description}</p>
          </div>

          {/* Related ads */}
          {related.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Similar Listings</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {related.map(r => (
                  <Link key={r.id} href={`/ads/${r.slug}`} className="card card-hover" style={{ padding: 0, overflow: 'hidden', display: 'block' }}>
                    <div style={{ height: 120, background: r.thumbnail ? `url(${r.thumbnail}) center/cover` : 'linear-gradient(135deg,#1e1b4b,#0f172a)', position: 'relative' }}>
                      {r.is_featured && <span className="badge badge-featured" style={{ position: 'absolute', top: 6, left: 6, fontSize: 9 }}>⭐</span>}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{r.title}</p>
                      <p style={{ color: '#818cf8', fontWeight: 700, fontSize: 14 }}>
                        {r.price ? `PKR ${Number(r.price).toLocaleString()}` : 'Contact'}
                      </p>
                      <p style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>📍 {r.city_name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

          {/* Price card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(56,189,248,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>Price</p>
            {ad.price ? (
              <p style={{ fontSize: 32, fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>
                PKR {Number(ad.price).toLocaleString()}
              </p>
            ) : (
              <p style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8' }}>Contact Seller</p>
            )}
          </div>

          {/* Seller card */}
          <div className="card">
            <p style={{ fontWeight: 600, marginBottom: 14, color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Seller
              {ad.seller_verified && <span style={{ color: '#22c55e', marginLeft: 8 }}>✓ Verified</span>}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                {(ad.seller_display_name || ad.owner_name)?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>
                  {ad.seller_display_name || ad.owner_name}
                </p>
                {ad.seller_business_name && (
                  <p style={{ color: '#64748b', fontSize: 12 }}>{ad.seller_business_name}</p>
                )}
              </div>
            </div>

            {ad.seller_phone && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {(() => {
                  if (!user) {
                    return (
                      <button
                        onClick={() => router.push('/login')}
                        className="btn"
                        style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: '#fff', border: 'none', fontWeight: 600 }}
                      >
                        💬 Chat on WhatsApp
                      </button>
                    );
                  }
                  const waPhone = ad.seller_phone.replace(/[^0-9+]/g, '');
                  const priceText = ad.price ? `PKR ${ad.price.toLocaleString()}` : "Price on request";
                  const waMessage = encodeURIComponent(`Hi ${ad.seller_display_name || ad.owner_name}, I'm interested in your ad for "${ad.title}" priced at ${priceText} that I saw on AdFlow Pro.`);
                  return (
                    <>
                      <a
                        href={`https://wa.me/${waPhone}?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: '#fff', border: 'none', fontWeight: 600 }}
                      >
                        💬 Chat on WhatsApp
                      </a>
                      <button
                        onClick={async () => {
                          if (!user) {
                            router.push(`/login?callback=/ads/${ad.slug}`);
                            return;
                          }
                          try {
                            const token = localStorage.getItem('adflow_token');
                            const res = await fetch('/api/chat/conversations', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ ad_id: ad.id, seller_id: ad.user_id })
                            });
                            const data = await res.json();
                            if (data.success) {
                              router.push(`/dashboard/chat?id=${data.conversation.id}`);
                            } else {
                              alert(data.error || 'Failed to start chat');
                            }
                          } catch (err) {
                            alert('Network error while starting chat');
                          }
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
                      >
                        ✉️ Chat with Seller
                      </button>
                    </>
                  );
                })()}

                {user ? (
                  <a
                    href={`tel:${ad.seller_phone}`}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    📞 Call {ad.seller_phone}
                  </a>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  >
                    📞 Call <span style={{ filter: 'blur(5px)', marginLeft: 4, userSelect: 'none', opacity: 0.8 }}>
                      {ad.seller_phone.slice(0, 4)}XXXXXXX
                    </span>
                  </button>
                )}
              </div>
            )}

            {ad.seller_city && (
              <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                📍 {ad.seller_city}
              </p>
            )}

            {!ad.seller_phone && (
              <p style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>
                Contact info not provided
              </p>
            )}
          </div>
          
          {/* Admin Tools */}
          {isAdmin && (
            <div className="card" style={{ border: '1px solid #f87171', background: 'rgba(239,68,68,0.05)' }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#f87171', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Tools</p>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="btn"
                style={{ width: '100%', justifyContent: 'center', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600 }}
              >
                {deleting ? 'Deleting...' : '🗑️ Delete This Ad'}
              </button>
              <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                Note: Deleting an ad is permanent and will remove all associated media and records.
              </p>
            </div>
          )}

          {/* Safety tips */}
          <div className="card" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b', marginBottom: 8 }}>⚠️ Safety Tips</p>
            <ul style={{ color: '#64748b', fontSize: 12, lineHeight: 1.8, paddingLeft: 16 }}>
              <li>Meet seller in a public place</li>
              <li>Verify item before payment</li>
              <li>Never pay in advance online</li>
            </ul>
          </div>

          {/* Back link */}
          <button onClick={() => router.back()} className="btn btn-ghost" style={{ justifyContent: 'center' }}>
            ← Back to Listings
          </button>
        </div>
      </div>
    </div>
  );
}
