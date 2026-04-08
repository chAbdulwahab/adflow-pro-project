'use client';

import { useState, useEffect, use } from 'react';
import { 
  MapPin, 
  Calendar, 
  User as UserIcon, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Clock, 
  Share2, 
  Flag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, formatCurrency, getStatusBadge } from '@/lib/utils';
import Link from 'next/link';

export default function AdDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(0);

  useEffect(() => {
    fetchAd();
  }, [slug]);

  const fetchAd = async () => {
    try {
      const res = await fetch(`/api/ads/${slug}`);
      const data = await res.json();
      setAd(data);
    } catch (err) {
      console.error('Failed to fetch ad');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!ad) return (
    <div className="max-w-7xl mx-auto px-4 py-40 text-center">
       <h1 className="text-4xl font-bold mb-4">Listing not found</h1>
       <p className="text-zinc-500 mb-8">This ad may have expired or been removed.</p>
       <Link href="/explore" className="btn-primary">Browse other ads</Link>
    </div>
  );

  const media = ad.media?.length > 0 ? ad.media : [{ 
    thumbnail_url: 'https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
    normalized_url: 'https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'
  }];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-4 mb-8 text-sm text-zinc-500">
         <Link href="/explore" className="flex items-center hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
         </Link>
         <span>/</span>
         <span className="text-zinc-300">{ad.category?.name}</span>
         <span>/</span>
         <span className="text-zinc-300 truncate max-w-[200px]">{ad.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Media & Description */}
        <div className="lg:col-span-2 space-y-8">
           {/* Gallery */}
           <div className="glass-panel overflow-hidden relative group">
              <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                 <AnimatePresence mode='wait'>
                    <motion.img 
                      key={activeMedia}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={media[activeMedia].normalized_url} 
                      className="w-full h-full object-contain"
                    />
                 </AnimatePresence>
                 
                 {media.length > 1 && (
                   <>
                     <button 
                       onClick={() => setActiveMedia((prev) => (prev - 1 + media.length) % media.length)}
                       className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <ChevronLeft className="w-6 h-6" />
                     </button>
                     <button 
                       onClick={() => setActiveMedia((prev) => (prev + 1) % media.length)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <ChevronRight className="w-6 h-6" />
                     </button>
                   </>
                 )}
              </div>
              
              {/* Thumbnails */}
              {media.length > 1 && (
                <div className="p-4 border-t border-white/5 flex gap-4 overflow-x-auto scrollbar-hide">
                   {media.map((m: any, i: number) => (
                     <button 
                       key={m.id || i}
                       onClick={() => setActiveMedia(i)}
                       className={cn(
                         "w-20 aspect-square rounded-lg overflow-hidden flex-shrink-0 transition-all border-2",
                         activeMedia === i ? "border-indigo-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                       )}
                     >
                       <img src={m.thumbnail_url} className="w-full h-full object-cover" />
                     </button>
                   ))}
                </div>
              )}
           </div>

           {/* Details */}
           <div className="glass-panel p-8 space-y-8">
              <div>
                 <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="badge bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{ad.category?.name}</span>
                    <span className="badge bg-white/5 text-zinc-400 border-white/10 flex items-center">
                       <MapPin className="w-3 h-3 mr-1" />
                       {ad.city?.name}
                    </span>
                    {ad.is_featured && (
                      <span className="badge bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    )}
                 </div>
                 <h1 className="text-4xl font-extrabold mb-4">{ad.title}</h1>
                 <p className="text-3xl font-bold text-indigo-400">PKR {formatCurrency(ad.price || 0)}</p>
              </div>

              <div className="pt-8 border-t border-white/5">
                 <h3 className="text-xl font-bold mb-4">Description</h3>
                 <div className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {ad.description}
                 </div>
              </div>

              <div className="pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
                 <div className="space-y-1">
                    <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">Posted On</span>
                    <p className="font-medium flex items-center"><Calendar className="w-4 h-4 mr-2 text-zinc-500" /> {formatDate(ad.published_at)}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">Views</span>
                    <p className="font-medium flex items-center"><Eye className="w-4 h-4 mr-2 text-zinc-500" /> {ad.view_count}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">City</span>
                    <p className="font-medium flex items-center"><MapPin className="w-4 h-4 mr-2 text-zinc-500" /> {ad.city?.name}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-xs text-zinc-600 font-bold uppercase tracking-wider">Expires In</span>
                    <p className="font-medium flex items-center text-rose-400"><Clock className="w-4 h-4 mr-2" /> {new Date(ad.expire_at).toLocaleDateString()}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Seller & Contact */}
        <div className="space-y-8">
           <div className="glass-panel p-8">
              <h3 className="text-lg font-bold mb-6">Seller Information</h3>
              <div className="flex items-center space-x-4 mb-6">
                 <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <UserIcon className="w-8 h-8 text-indigo-500" />
                 </div>
                 <div>
                    <div className="flex items-center space-x-2">
                       <h4 className="font-bold text-lg">{ad.seller?.display_name}</h4>
                       {ad.seller?.is_verified && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <p className="text-sm text-zinc-500">{ad.seller?.business_name || 'Individual Seller'}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 {ad.seller?.is_verified && (
                   <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center space-x-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Verified Seller</span>
                   </div>
                 )}
                 <div className="p-4 bg-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-zinc-500">Member Since</span>
                       <span className="text-xs font-bold">{formatDate(ad.seller?.created_at || new Date())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-zinc-500">Total Ads</span>
                       <span className="text-xs font-bold">{ad.seller?.total_ads_posted || 0}</span>
                    </div>
                 </div>
              </div>

              <div className="mt-8 space-y-4">
                 <a 
                   href={`tel:${ad.contact_phone}`} 
                   className="btn-primary w-full py-4 flex items-center justify-center space-x-3"
                 >
                    <Phone className="w-5 h-5" />
                    <span className="font-bold">{ad.contact_phone || 'Call Seller'}</span>
                 </a>
                 <a 
                   href={`mailto:${ad.contact_email}`} 
                   className="btn-secondary w-full py-4 flex items-center justify-center space-x-3"
                 >
                    <Mail className="w-5 h-5" />
                    <span>Send Message</span>
                 </a>
              </div>
           </div>

           <div className="glass-panel p-8">
              <h3 className="text-lg font-bold mb-6">Interactions</h3>
              <div className="grid grid-cols-2 gap-4">
                 <button className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-white/5 transition-all text-center border border-white/[0.03]">
                    <Share2 className="w-5 h-5 mb-2 text-indigo-400" />
                    <span className="text-xs text-zinc-400">Share</span>
                 </button>
                 <button className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-white/5 transition-all text-center border border-white/[0.03]">
                    <Flag className="w-5 h-5 mb-2 text-rose-400" />
                    <span className="text-xs text-zinc-400">Report</span>
                 </button>
              </div>
           </div>

           <div className="glass-panel p-8 border-indigo-500/20 bg-indigo-500/5">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                 <Star className="w-5 h-5 mr-2 text-amber-500" />
                 Safety Tips
              </h3>
              <ul className="text-xs text-zinc-400 space-y-3 list-disc pl-4">
                 <li>Meet the seller in a safe, public place.</li>
                 <li>Check the item properly before paying.</li>
                 <li>Pay only after verifying the product.</li>
                 <li>Avoid sharing personal sensitive info.</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
