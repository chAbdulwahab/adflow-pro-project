'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  is_verified: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch(`/api/admin/users?search=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        alert(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adflow_token');
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, isVerified: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Client Management</h1>
          <p style={{ color: '#64748b' }}>Manage registered sellers and verify trusted accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            placeholder="Search name or email..." 
            className="input"
            style={{ width: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(search)}
          />
          <button className="btn btn-primary" onClick={() => fetchUsers(search)}>Search</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Seller</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Registered</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No sellers found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '16px 24px' }}>
                    <p style={{ fontWeight: 700, marginBottom: 2 }}>{u.name} {u.is_verified && <span style={{ color: '#38bdf8', fontSize: 14 }}>✓</span>}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{u.email}</p>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748b', fontSize: 13 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {u.is_verified ? (
                      <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Verified
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} /> Standard
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleVerify(u.id, u.is_verified)}
                      className="btn btn-sm"
                      style={{ 
                        background: u.is_verified ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', 
                        color: u.is_verified ? '#f87171' : '#4ade80',
                        border: 'none',
                        fontWeight: 600
                      }}
                    >
                      {u.is_verified ? 'Remove Tick' : 'Verify Seller'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
