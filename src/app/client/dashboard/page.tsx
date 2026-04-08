'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle, 
  Settings, 
  Bell,
  MoreVertical,
  Eye,
  Trash2,
  Edit2,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatDate, getStatusBadge } from '@/lib/utils';
import Link from 'next/link';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchDashboardData();
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch('/api/client/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error('Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      const token = localStorage.getItem('adflow_token');
      await fetch(`/api/client/ads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete ad');
    }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: 'Total Listings', val: data?.stats.total_ads, icon: Package, color: 'text-indigo-400' },
    { label: 'Active Ads', val: data?.stats.active_ads, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Under Review', val: data?.stats.pending_review, icon: Clock, color: 'text-amber-400' },
    { label: 'Expired', val: data?.stats.expired_ads, icon: AlertCircle, color: 'text-rose-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">My <span className="text-indigo-500">Dashboard</span></h1>
          <p className="text-zinc-500">Welcome back, {user?.name}. Manage your listings and grow your business.</p>
        </div>
        <Link href="/client/ads/new" className="btn-primary flex items-center space-x-2 py-4 px-8">
           <PlusCircle className="w-5 h-5" />
           <span>Post New Listing</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
         {stats.map((s, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="glass-panel p-6"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className={cn("p-2 rounded-lg bg-white/5", s.color)}>
                    <s.icon className="w-6 h-6" />
                 </div>
                 <BarChart3 className="w-4 h-4 text-zinc-700" />
              </div>
              <h4 className="text-zinc-500 text-sm font-medium">{s.label}</h4>
              <p className="text-3xl font-bold mt-1 tracking-tight">{s.val}</p>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Notifications */}
        <div className="lg:col-span-1 space-y-6">
           <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="font-bold flex items-center space-x-2">
                 <Bell className="w-5 h-5 text-indigo-400" />
                 <span>Notifications</span>
              </h3>
              <span className="text-xs text-zinc-500">View all</span>
           </div>
           
           <div className="space-y-4">
              {data?.notifications.length > 0 ? (
                data.notifications.map((n: any) => (
                  <motion.div 
                    key={n.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className={cn(
                      "glass-panel p-4 border-l-4 transition-all hover:bg-white/10",
                      n.is_read ? "border-transparent opacity-60" : "border-indigo-500"
                    )}
                  >
                     <h4 className="text-sm font-bold mb-1">{n.title}</h4>
                     <p className="text-xs text-zinc-400 line-clamp-2">{n.message}</p>
                     <p className="text-[10px] text-zinc-600 mt-2">{formatDate(n.created_at)}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 glass-panel opacity-50">
                   <p className="text-sm">No new notifications</p>
                </div>
              )}
           </div>
        </div>

        {/* Listings Table */}
        <div className="lg:col-span-2">
           <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="font-bold flex items-center space-x-2">
                 <Package className="w-5 h-5 text-indigo-400" />
                 <span>My Listings</span>
              </h3>
              <div className="flex space-x-2">
                 <button className="p-2 glass-panel hover:bg-white/10 transition-colors"><Settings className="w-4 h-4" /></button>
                 <button className="p-2 glass-panel hover:bg-white/10 transition-colors"><MoreVertical className="w-4 h-4" /></button>
              </div>
           </div>

           <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-white/5 text-zinc-400 text-xs uppercase tracking-widest">
                          <th className="px-6 py-4 font-semibold">Listing</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Package</th>
                          <th className="px-6 py-4 font-semibold">Stats</th>
                          <th className="px-6 py-4 font-semibold">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {data?.ads.length > 0 ? (
                         data.ads.map((ad: any) => {
                           const badge = getStatusBadge(ad.status);
                           return (
                             <tr key={ad.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-5">
                                   <div className="flex items-center space-x-3">
                                      <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                                         <img src="https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-1.2.1" className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                         <p className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">{ad.title}</p>
                                         <p className="text-[10px] text-zinc-500 mt-0.5">{formatDate(ad.created_at)}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <span className={cn("badge", badge.className)}>
                                      {badge.label}
                                   </span>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex items-center space-x-1.5">
                                      <span className={cn("w-1.5 h-1.5 rounded-full", ad.package?.is_featured ? "bg-indigo-500" : "bg-zinc-500")} />
                                      <span className="text-xs font-semibold text-zinc-300">{ad.package?.name}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex items-center space-x-4 text-xs">
                                      <span className="flex items-center space-x-1 text-zinc-500">
                                         <Eye className="w-3.5 h-3.5" />
                                         <span>{ad.view_count || 0}</span>
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex items-center space-x-3">
                                      {ad.status === 'payment_pending' && (
                                        <Link href={`/client/payments/new?ad_id=${ad.id}`} className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Pay Now">
                                          <CreditCard className="w-4 h-4" />
                                        </Link>
                                      )}
                                      {['draft', 'rejected'].includes(ad.status) && (
                                        <Link href={`/client/ads/edit/${ad.id}`} className="p-2 text-zinc-400 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                                          <Edit2 className="w-4 h-4" />
                                        </Link>
                                      )}
                                      <Link href={`/ads/${ad.slug}`} className="p-2 text-zinc-400 hover:bg-white/10 rounded-lg transition-colors" title="View Listing">
                                        <ExternalLink className="w-4 h-4" />
                                      </Link>
                                      <button 
                                        onClick={() => deleteAd(ad.id)}
                                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                           );
                         })
                       ) : (
                         <tr>
                           <td colSpan={5} className="px-6 py-20 text-center text-zinc-500">
                              No listings found. Post your first ad today!
                           </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
