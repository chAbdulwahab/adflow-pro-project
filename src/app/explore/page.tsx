'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, MapPin, Tag, Clock, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatPrice, getStatusBadge } from '@/lib/utils';
import Link from 'next/link';

export default function ExplorePage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: '',
    sort: 'rank'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAds();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [catRes, cityRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/cities')
      ]);
      setCategories(await catRes.json());
      setCities(await cityRes.json());
    } catch (err) {
      console.error('Failed to fetch filter data');
    }
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      params.append('sort', filters.sort);

      const res = await fetch(`/api/ads?${params.toString()}`);
      const data = await res.json();
      setAds(data.data || []);
    } catch (err) {
      console.error('Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header & Search */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Explore <span className="text-indigo-500">Listings</span></h1>
        <p className="text-zinc-400 mb-8">Browse thousands of verified products and services</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text"
              placeholder="What are you looking for?"
              className="input-field pl-12 py-4 text-lg"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select 
              className="input-field pl-12 appearance-none h-full"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            >
              <option value="">All Cities</option>
              {cities.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select 
              className="input-field pl-12 appearance-none h-full"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 space-y-8">
           <div>
             <h4 className="font-bold mb-4 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Sort By</span>
             </h4>
             <div className="space-y-2">
                {['rank', 'newest', 'price_asc', 'price_desc', 'views'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilters({...filters, sort: s})}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                      filters.sort === s ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
             </div>
           </div>
           
           <div className="glass-panel p-6">
              <h4 className="font-bold mb-4 flex items-center space-x-2 text-indigo-400">
                 <Sparkles className="w-4 h-4" />
                 <span>Featured Ads</span>
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Featured ads appear at the top and get up to 10x more visibility.
              </p>
              <Link href="/packages" className="mt-4 block text-xs font-bold text-white hover:underline">Grow your reach →</Link>
           </div>
        </aside>

        {/* Ads Grid */}
        <main className="flex-grow">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="glass-card h-80 animate-pulse" />
                ))}
             </div>
          ) : ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode='popLayout'>
                {ads.map((ad: any) => (
                  <motion.div
                    key={ad.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/ads/${ad.slug}`} className="group h-full flex flex-col glass-card overflow-hidden">
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                        {ad.is_featured && (
                          <div className="absolute top-3 left-3 z-10 bg-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center space-x-1">
                             <Sparkles className="w-3 h-3" />
                             <span>Featured</span>
                          </div>
                        )}
                        <img 
                          src={ad.media?.[0]?.thumbnail_url || 'https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'} 
                          alt={ad.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <span className="text-white text-sm font-medium">View Details →</span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">{ad.category?.name}</span>
                           <span className="font-bold text-lg text-white">PKR {formatPrice(ad.price)}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg line-clamp-1 mb-2 group-hover:text-indigo-400 transition-colors">{ad.title}</h3>
                        <p className="text-zinc-500 text-sm line-clamp-2 mb-4 flex-grow">{ad.description}</p>
                        
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-zinc-500 text-[11px]">
                           <div className="flex items-center space-x-3">
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{ad.city?.name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Post in {new Date(ad.published_at).toLocaleDateString()}</span>
                              </span>
                           </div>
                           <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{ad.view_count}</span>
                           </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 glass-panel">
               <div className="p-4 bg-white/5 rounded-full mb-6">
                 <Search className="w-12 h-12 text-zinc-700" />
               </div>
               <h3 className="text-2xl font-bold mb-2">No listings found</h3>
               <p className="text-zinc-500">Try adjusting your filters or search terms</p>
               <button 
                 onClick={() => setFilters({search: '', category: '', city: '', sort: 'rank'})}
                 className="mt-6 text-indigo-400 font-bold hover:underline"
               >
                 Clear all filters
               </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
