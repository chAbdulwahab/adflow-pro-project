'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ClipboardCheck, 
  MessageSquare, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  CreditCard,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      router.push('/login');
    }
    if (user) fetchAdminData();
  }, [user, authLoading]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error('Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen">
       <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: 'Total Revenue', val: formatCurrency(data?.stats.total_revenue), icon: DollarSign, color: 'emerald', trend: '+12.5%' },
    { label: 'Total Users', val: data?.stats.total_users, icon: Users, color: 'indigo', trend: '+43' },
    { label: 'Active Ads', val: data?.stats.active_ads, icon: ShoppingBag, color: 'amber', trend: '+18' },
    { label: 'Pending Reviews', val: data?.stats.pending_reviews, icon: ClipboardCheck, color: 'rose', trend: '-2' },
  ];

  const quickActions = [
    { name: 'Verify Payments', href: '/admin/payments', icon: CreditCard, count: data?.stats.pending_payments, color: 'bg-emerald-500/10 text-emerald-500' },
    { name: 'Ad Queue', href: '/moderator/queue', icon: ClipboardCheck, count: data?.stats.pending_reviews, color: 'bg-indigo-500/10 text-indigo-500' },
    { name: 'System Logs', href: '/admin/audit', icon: FileText, color: 'bg-zinc-500/10 text-zinc-500' },
    { name: 'Broadcaster', href: '/admin/notify', icon: Send, color: 'bg-amber-500/10 text-amber-500' },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Admin Meta */}
      <div className="flex items-center justify-between mb-12">
         <div>
            <h1 className="text-4xl font-bold mb-2">System <span className="text-indigo-500">Intelligence</span></h1>
            <p className="text-zinc-500">Platform-wide overview and operational controls.</p>
         </div>
         <div className="flex items-center space-x-3 glass-panel px-4 py-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Global Status: Healthy</span>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
               <s.icon className="w-16 h-16" />
            </div>
            <div className="flex justify-between items-start mb-4">
               <div className={cn("p-2 rounded-lg bg-white/5", `text-${s.color}-400`)}>
                  <s.icon className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {s.trend}
               </span>
            </div>
            <h4 className="text-zinc-500 text-sm font-medium">{s.label}</h4>
            <p className="text-3xl font-extrabold mt-1 tracking-tight text-white">{s.val}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Chart 1: Revenue by Package */}
         <div className="lg:col-span-2 glass-panel p-8">
            <h3 className="text-lg font-bold mb-8 flex items-center">
               <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
               Revenue Distribution
            </h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.chart_data.revenue_by_package}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                     <XAxis dataKey="package" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(9,9,11,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
                        itemStyle={{ color: '#fff' }}
                     />
                     <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {data?.chart_data.revenue_by_package.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Quick Actions & Stats */}
         <div className="space-y-8">
            <div className="glass-panel p-8">
               <h3 className="text-lg font-bold mb-6">Operations Queue</h3>
               <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((a, i) => (
                    <Link key={i} href={a.href} className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-white/5 transition-all text-center border border-white/[0.03]">
                       <div className={cn("p-3 rounded-full mb-3 relative", a.color)}>
                          <a.icon className="w-5 h-5" />
                          {a.count > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">{a.count}</span>
                            </span>
                          )}
                       </div>
                       <span className="text-xs font-bold text-zinc-300">{a.name}</span>
                    </Link>
                  ))}
               </div>
            </div>

            <div className="glass-panel p-8">
               <h3 className="text-lg font-bold mb-6">Ads by Category</h3>
               <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={data?.chart_data.ads_by_category}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="count"
                        >
                           {data?.chart_data.ads_by_category.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: 'rgba(9,9,11,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  {data?.chart_data.ads_by_category.map((c: any, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{c.category}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
