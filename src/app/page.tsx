'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, TrendingUp, ShieldCheck, Zap, BarChart3, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    { title: 'Smart Moderation', desc: 'Secure approval workflow ensuring quality.', icon: ShieldCheck, color: 'text-emerald-400' },
    { title: 'Featured Ranking', desc: 'Boost visibility with premium boost slots.', icon: TrendingUp, color: 'text-indigo-400' },
    { title: 'Real-time Stats', desc: 'Advanced analytics for every listing.', icon: BarChart3, color: 'text-amber-400' },
    { title: 'Instant Delivery', desc: 'Scheduled publishing across the globe.', icon: Zap, color: 'text-rose-400' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-40 -right-4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl -z-10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-400 text-sm font-medium">New: Advanced Analytics Dashboard</span>
          </motion.div>
          
          <motion.h1 
            {...fadeInUp}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8"
          >
            The Marketplace <br />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-500 bg-clip-text text-transparent">Reinvented for Pros</span>
          </motion.h1>

          <motion.p 
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Experience a production-style ad platform with enterprise-grade moderation, payment verification, and automated scheduling.
          </motion.p>

          <motion.div 
             {...fadeInUp}
             transition={{ delay: 0.3 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/explore" className="btn-primary py-4 px-10 text-lg flex items-center group">
              Explore Listings
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/packages" className="btn-secondary py-4 px-10 text-lg">
              View Pricing
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
          >
            <div className="flex items-center justify-center space-x-2 font-bold text-lg">TechFlow</div>
            <div className="flex items-center justify-center space-x-2 font-bold text-lg">MarketPulse</div>
            <div className="flex items-center justify-center space-x-2 font-bold text-lg">AdVantage</div>
            <div className="flex items-center justify-center space-x-2 font-bold text-lg">SwiftSale</div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Mockup Section */}
      <section className="py-20 px-4 bg-white/5 border-y border-white/5 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold">Why Choice <span className="text-indigo-500">AdFlow Pro?</span></h2>
            <div className="space-y-6">
               {features.map((f, i) => (
                 <div key={i} className="flex items-start space-x-4">
                    <div className={cn("p-2 rounded-lg bg-white/5", f.color)}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{f.title}</h4>
                      <p className="text-zinc-400">{f.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative"
          >
            <div className="glass-panel p-6 overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold">Analytics Dashboard</h3>
                 <div className="flex space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                 </div>
               </div>
               <div className="space-y-4">
                  <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                  <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                  <div className="grid grid-cols-3 gap-4 mt-8">
                     <div className="h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-emerald-400">Published</span>
                        <span className="text-xl font-bold">124</span>
                     </div>
                     <div className="h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-indigo-400">Revenue</span>
                        <span className="text-xl font-bold">$12.5k</span>
                     </div>
                     <div className="h-20 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-rose-400">Banned</span>
                        <span className="text-xl font-bold">3</span>
                     </div>
                  </div>
               </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-10 -right-10 glass-card p-4 animate-float">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center"><Star className="w-5 h-5 text-white" /></div>
                  <div>
                    <div className="text-xs text-zinc-500">Ad Status</div>
                    <div className="text-sm font-bold text-emerald-400">Verified</div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 text-center">
          <div className="max-w-4xl mx-auto glass-panel p-16 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -z-10" />
             <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Scale Your Brand?</h2>
             <p className="text-xl text-zinc-400 mb-12">
               Join 5,000+ businesses listing their products on AdFlow Pro.
             </p>
             <Link href="/register" className="btn-primary py-4 px-12 text-xl font-bold inline-flex items-center shadow-indigo-600/50">
               Get Started for Free <ArrowRight className="ml-3" />
             </Link>
          </div>
      </section>
    </div>
  );
}
