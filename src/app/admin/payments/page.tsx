'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  DollarSign, 
  User as UserIcon,
  Search,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      router.push('/login');
    }
    if (user) fetchPayments();
  }, [user, authLoading]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch('/api/admin/payment-queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(data.data || []);
    } catch (err) {
      console.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'verify' | 'reject', reason?: string) => {
    setProcessing(id);
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch(`/api/admin/payments/${id}/verify`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action, reason })
      });
      
      if (res.ok) {
        setPayments(payments.filter((p: any) => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
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
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
           <CreditCard className="w-8 h-8 mr-4 text-emerald-400" />
           Payment <span className="text-indigo-500 ml-3">Verification</span>
        </h1>
        <p className="text-zinc-500">Review and verify transaction proofs from clients to activate their listings.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode='popLayout'>
          {payments.length > 0 ? (
            payments.map((p: any) => (
              <motion.div 
                key={p.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-8 group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <DollarSign className="w-32 h-32" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-1 space-y-4">
                      <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Transaction Ref</div>
                      <p className="font-mono text-emerald-400 font-bold bg-emerald-400/5 px-2 py-1 rounded inline-block">{p.transaction_ref}</p>
                      <div className="space-y-1">
                         <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Amount</div>
                         <p className="text-2xl font-extrabold">PKR {p.amount}</p>
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center space-x-1">
                         <span>via</span>
                         <span className="font-bold text-zinc-300 uppercase">{p.method?.replace('_', ' ')}</span>
                      </div>
                   </div>

                   <div className="lg:col-span-1 space-y-4">
                      <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Client & Listing</div>
                      <div className="flex items-center space-x-3">
                         <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <UserIcon className="w-4 h-4 text-indigo-400" />
                         </div>
                         <div className="text-sm">
                            <p className="font-bold text-white">{p.user?.name}</p>
                            <p className="text-zinc-500">{p.user?.email}</p>
                         </div>
                      </div>
                      <Link 
                        href={`/ads/${p.ad?.slug}`} 
                        className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium border-t border-white/5 pt-3 mt-3"
                      >
                         <ExternalLink className="w-4 h-4 mr-2" />
                         {p.ad?.title}
                      </Link>
                   </div>

                   <div className="lg:col-span-1">
                      <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest mb-3">Proof Snapshot</div>
                      {p.screenshot_url ? (
                        <a href={p.screenshot_url} target="_blank" className="block relative aspect-video rounded-xl overflow-hidden border border-white/10 group/img">
                           <img src={p.screenshot_url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <Search className="w-6 h-6 text-white" />
                           </div>
                        </a>
                      ) : (
                        <div className="aspect-video bg-white/5 rounded-xl flex flex-col items-center justify-center border border-dashed border-white/10">
                           <AlertCircle className="w-6 h-6 text-zinc-700 mb-2" />
                           <span className="text-xs text-zinc-600">No screenshot provided</span>
                        </div>
                      )}
                   </div>

                   <div className="lg:col-span-1 flex flex-col justify-end space-y-3">
                      <button 
                         disabled={!!processing}
                         onClick={() => handleAction(p.id, 'verify')}
                         className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 translate-y-0"
                      >
                         {processing === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <CheckCircle className="w-5 h-5" /> <span>Verify Payment</span> </>}
                      </button>
                      <button 
                         disabled={!!processing}
                         onClick={() => {
                           const r = prompt('Reason for rejection:');
                           if (r) handleAction(p.id, 'reject', r);
                         }}
                         className="w-full h-12 bg-white/5 hover:bg-rose-600/10 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
                      >
                         <XCircle className="w-5 h-5" />
                         <span>Reject</span>
                      </button>
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-32 glass-panel flex flex-col items-center justify-center opacity-40">
               <CheckCircle className="w-16 h-16 mb-6" />
               <h3 className="text-2xl font-bold">Queue is empty</h3>
               <p className="text-sm">All pending payments have been processed.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
