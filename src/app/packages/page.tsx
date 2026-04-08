'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, Shield, TrendingUp, Sparkles, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/packages')
      .then(res => res.json())
      .then(data => {
        setPackages(data);
        setLoading(false);
      });
  }, []);

  const features = [
    { name: 'Public Visibility', basic: true, standard: true, premium: true },
    { name: 'Ad Duration', basic: '7 Days', standard: '15 Days', premium: '30 Days' },
    { name: 'Search Priority', basic: 'Normal', standard: 'High', premium: 'Top Tier' },
    { name: 'Featured Badge', basic: false, standard: true, premium: true },
    { name: 'Video Support', basic: false, standard: false, premium: true },
    { name: 'Social Promotion', basic: false, standard: false, premium: true },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Choose Your <span className="text-indigo-500">Momentum</span></h1>
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto">Select the perfect listing package to accelerate your sales and reach the right audience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
        {packages.map((pkg: any, i: number) => (
          <motion.div 
            key={pkg.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "group relative glass-panel p-10 flex flex-col h-full transition-all duration-500 hover:-translate-y-2",
              pkg.name === 'Premium' && "border-indigo-500 shadow-2xl shadow-indigo-500/10 bg-indigo-500/5"
            )}
          >
            {pkg.name === 'Premium' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center shadow-lg">
                <Sparkles className="w-3 h-3 mr-2" />
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
               <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
               <p className="text-sm text-zinc-500 min-h-[40px]">{pkg.description || `Optimized for ${pkg.duration_days} days of maximum exposure.`}</p>
            </div>
            
            <div className="mb-10 flex items-baseline space-x-2">
               <span className="text-4xl font-extrabold">PKR {pkg.price}</span>
               <span className="text-zinc-500 text-xs">/ {pkg.duration_days} days</span>
            </div>

            <div className="space-y-4 mb-12 flex-grow">
               <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-3 text-indigo-400" />
                  <span className="text-zinc-300">{pkg.duration_days} Days Visibility</span>
               </div>
               <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-3 text-indigo-400" />
                  <span className="text-zinc-300">Weight Level: {pkg.weight}x</span>
               </div>
               {features.map((f, idx) => {
                  const val = pkg.name === 'Basic' ? f.basic : pkg.name === 'Standard' ? f.standard : f.premium;
                  return (
                    <div key={idx} className={cn("flex items-center text-sm", !val && "opacity-30")}>
                       <Check className={cn("w-4 h-4 mr-3", val ? "text-emerald-400" : "text-zinc-700")} />
                       <span className="text-zinc-300">{typeof val === 'string' ? val : f.name}</span>
                    </div>
                  );
               })}
            </div>

            <Link 
              href="/register" 
              className={cn(
                "w-full py-4 text-center rounded-xl font-bold transition-all active:scale-95",
                pkg.name === 'Premium' 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20" 
                  : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
              )}
            >
              Get Started
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-40 glass-panel p-16 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
         <Globe className="w-16 h-16 text-indigo-600/40 mx-auto mb-8 animate-[spin_10s_linear_infinite]" />
         <h2 className="text-3xl font-bold mb-6">Need a custom solution for your enterprise?</h2>
         <p className="text-zinc-500 mb-10 max-w-xl mx-auto">We offer bespoke packages for agencies and high-volume sellers. Get in touch with our partnerships team.</p>
         <button className="btn-secondary px-10">Contact Sales Team</button>
      </div>
    </div>
  );
}
