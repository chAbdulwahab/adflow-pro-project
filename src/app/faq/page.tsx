'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Shield, CreditCard, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I list an ad on AdFlow Pro?",
      a: "Simply create an account, go to your dashboard, and click 'Post New Listing'. Fill in the details, choose a package, and submit it for our moderation team to review.",
      icon: HelpCircle
    },
    {
      q: "What is the moderation process?",
      a: "Every ad is manually reviewed by our moderators to ensure it complies with our quality standards. This usually takes 2-6 hours during business days.",
      icon: Shield
    },
    {
      q: "When do I pay for my ad?",
      a: "Once your ad is approved by a moderator, its status changes to 'Payment Pending'. You can then submit your payment proof through the portal to get it verified by an admin.",
      icon: CreditCard
    },
    {
      q: "How long is my ad visible?",
      a: "Visibility depends on the package you choose: Basic (7 days), Standard (15 days), and Premium (30 days).",
      icon: Clock
    },
    {
      q: "Can I edit my ad after it's published?",
      a: "No, published ads cannot be edited to maintain platform integrity. If you need changes, you'll need to contact support or wait for it to expire and repost as a draft.",
      icon: Globe
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Frequently Asked <span className="text-indigo-500">Questions</span></h1>
        <p className="text-zinc-500 text-lg">Everything you need to know about the AdFlow Pro ecosystem.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-panel overflow-hidden">
            <button 
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center space-x-4">
                 <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400">
                    <faq.icon className="w-5 h-5" />
                 </div>
                 <span className="font-bold text-lg text-white">{faq.q}</span>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform duration-300", openIndex === i && "rotate-180")} />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-8 pb-6 pt-0 text-zinc-400 leading-relaxed pl-[4.5rem]">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
