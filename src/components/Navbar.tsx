'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, LogOut, User, Menu, X, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Explore', href: '/explore' },
    { name: 'Packages', href: '/packages' },
    { name: 'FAQ', href: '/faq' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">AdFlow<span className="text-indigo-500">Pro</span></span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-zinc-300 hover:text-white font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
                <Link href="/client/ads/new" className="btn-primary flex items-center space-x-2 py-2 px-4 text-sm">
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Ad</span>
                </Link>
                <Link 
                  href={user.role === 'client' ? '/client/dashboard' : '/admin/dashboard'}
                  className="p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-zinc-300 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-zinc-300 hover:text-white font-medium">Login</Link>
                <Link href="/register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute w-full bg-black/95 backdrop-blur-3xl border-b border-white/5 transition-all duration-300 ease-in-out overflow-hidden",
        mobileMenuOpen ? "max-h-[30rem] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-3 py-4 text-base font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
            {user ? (
              <>
                <Link 
                  href="/client/ads/new"
                  className="flex items-center space-x-3 px-3 py-3 text-indigo-400 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Post New Ad</span>
                </Link>
                <Link 
                  href={user.role === 'client' ? '/client/dashboard' : '/admin/dashboard'}
                  className="flex items-center space-x-3 px-3 py-3 text-zinc-300 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 w-full px-3 py-3 text-red-400 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link href="/login" className="flex items-center justify-center p-3 rounded-lg bg-white/5 text-white font-medium">Login</Link>
                <Link href="/register" className="flex items-center justify-center p-3 rounded-lg bg-indigo-600 text-white font-medium">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
