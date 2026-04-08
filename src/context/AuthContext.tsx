'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/lib/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('adflow_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('adflow_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Login failed' };
    const authUser: AuthUser = { ...data, token: data.token };
    setUser(authUser);
    localStorage.setItem('adflow_user', JSON.stringify(authUser));
    localStorage.setItem('adflow_token', data.token);
    return {};
  };

  const register = async (name: string, email: string, password: string, role = 'client') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Registration failed' };
    const authUser: AuthUser = { ...data, token: data.token };
    setUser(authUser);
    localStorage.setItem('adflow_user', JSON.stringify(authUser));
    localStorage.setItem('adflow_token', data.token);
    return {};
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adflow_user');
    localStorage.removeItem('adflow_token');
  };

  const refreshUser = () => {
    const stored = localStorage.getItem('adflow_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('adflow_user');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
