'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: regErr } = await register(formData.name, formData.email, formData.password, formData.role);
      if (regErr) {
        setError(regErr);
      } else {
        router.push('/client/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full glass-panel p-10 shadow-2xl relative"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <UserPlus className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold">Join AdFlow Pro</h1>
          <p className="text-zinc-500 mt-2">Start showcasing your products to thousands</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field pl-12"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">Account Type</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="input-field"
              >
                <option value="client">Client (Seller)</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field pl-12"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-field pl-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed pt-2 px-1">
            By clicking "Create Account", you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
          </p>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-lg font-bold"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            ) : (
              <>
                <span>Create Account</span>
                <UserPlus className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-zinc-500">
          Already have an account? <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4">Sign in here</Link>
        </p>
      </motion.div>
    </div>
  );
}
