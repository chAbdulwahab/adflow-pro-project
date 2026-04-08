'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error: loginErr } = await login(email, password);
      if (loginErr) {
        setError(loginErr);
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-8 shadow-2xl relative"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <LogIn className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-zinc-500 mt-2">Enter your credentials to access AdFlow Pro</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-12"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-3.5 flex items-center justify-center space-x-2 text-lg font-bold"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-white/50" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-zinc-500">
          Don't have an account? <Link href="/register" className="text-indigo-400 font-bold hover:text-indigo-300 underline underline-offset-4">Create one for free</Link>
        </p>
      </motion.div>
    </div>
  );
}
