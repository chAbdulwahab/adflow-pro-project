'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Tag, 
  User as UserIcon,
  Search,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, getStatusBadge } from '@/lib/utils';
import Link from 'next/link';

export default function ModeratorQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (user?.role !== 'moderator' && user?.role !== 'admin' && user?.role !== 'super_admin')) {
      router.push('/login');
    }
    if (user) fetchQueue();
  }, [user, authLoading]);

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch('/api/moderator/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAds(data.data || []);
    } catch (err) {
      console.error('Failed to fetch moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject', notes?: string) => {
    setProcessing(id);
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch(`/api/moderator/ads/${id}/review`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action, notes })
      });
      
      if (res.ok) {
        setAds(ads.filter((a: any) => a.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Review failed');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center">
             <ClipboardCheck className="w-8 h-8 mr-4 text-indigo-400" />
             Content <span className="text-indigo-500 ml-3">Moderation</span>
          </h1>
          <p className="text-zinc-500">Review pending listings for quality and compliance. Every ad matters.</p>
        </div>
        <div className="glass-panel px-6 py-3 border-indigo-500/20">
           <div className="flex items-center space-x-3">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-sm font-bold text-zinc-300">{ads.length} Items in Queue</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode='popLayout'>
          {ads.length > 0 ? (
            ads.map((ad: any) => (
              <motion.div 
                key={ad.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="glass-panel overflow-hidden border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex flex-col lg:flex-row">
                   {/* Ad Preview Section */}
                   <div className="lg:w-1/3 aspect-video lg:aspect-square relative overflow-hidden bg-zinc-900 border-r border-white/5">
                      <img 
                        src={ad.media?.[0]?.thumbnail_url || 'https://images.unsplash.com/photo-1593642532400-2682810df593'} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                         <span className="badge bg-indigo-500/20 text-indigo-400 border-indigo-500/30 mb-2">{ad.category?.name}</span>
                         <h3 className="font-bold text-lg text-white line-clamp-2">{ad.title}</h3>
                      </div>
                      <Link 
                        href={`/ads/${ad.slug}`} 
                        target="_blank"
                        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <ExternalLink className="w-4 h-4" />
                      </Link>
                   </div>

                   {/* Moderation Details */}
                   <div className="flex-grow p-8 flex flex-col">
                      <div className="flex flex-wrap gap-8 items-start mb-8">
                         <div className="space-y-1">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Seller</span>
                            <div className="flex items-center space-x-2">
                               <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                               <span className="text-sm font-bold">{ad.seller?.display_name || 'Individual'}</span>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Submitted</span>
                            <div className="flex items-center space-x-2">
                               <Clock className="w-3.5 h-3.5 text-zinc-500" />
                               <span className="text-sm font-bold">{formatDate(ad.updated_at)}</span>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Package</span>
                            <div className="flex items-center space-x-2">
                               <Tag className="w-3.5 h-3.5 text-indigo-500" />
                               <span className="text-sm font-bold text-indigo-400">{ad.package?.name} ({ad.package?.duration_days}d)</span>
                            </div>
                         </div>
                      </div>

                      <div className="flex-grow">
                         <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center">
                            <ShieldAlert className="w-3.5 h-3.5 mr-2" />
                            Safety Check: Description Preview
                         </h4>
                         <div className="p-4 bg-white/5 rounded-xl text-sm text-zinc-400 line-clamp-4 leading-relaxed italic border border-white/5">
                            "{ad.description}"
                         </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                         <div className="flex space-x-3">
                            <span className="px-3 py-1 rounded bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase flex items-center">
                               <Eye className="w-3 h-3 mr-2" />
                               {ad.media?.length || 0} Medias
                            </span>
                         </div>
                         <div className="flex space-x-4">
                            <button 
                               disabled={!!processing}
                               onClick={() => handleAction(ad.id, 'approve')}
                               className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                               {processing === ad.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <CheckCircle className="w-5 h-5" /> <span>Approve</span> </>}
                            </button>
                            <button 
                               disabled={!!processing}
                               onClick={() => {
                                 const n = prompt('Reason for rejection:');
                                 if (n) handleAction(ad.id, 'reject', n);
                               }}
                               className="px-8 py-3 bg-white/5 hover:bg-rose-600/10 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-xl font-bold flex items-center space-x-2 transition-all active:scale-95"
                            >
                               <XCircle className="w-5 h-5" />
                               <span>Reject Listing</span>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-40 glass-panel flex flex-col items-center justify-center opacity-40">
               <ShieldAlert className="w-16 h-16 mb-6" />
               <h3 className="text-2xl font-bold">Queue is empty</h3>
               <p className="text-sm">Great job! All pending ads have been moderated.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
