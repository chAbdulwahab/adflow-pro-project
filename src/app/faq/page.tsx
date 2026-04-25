'use client';

import { FAQ_DATA } from '@/constants/faq';
import { useState } from 'react';

export default function FaqPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaq = FAQ_DATA.filter(item => 
    item.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '60px 24px', maxWidth: 900 }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16 }}>Frequently Asked Questions</h1>
        <p style={{ color: '#64748b', fontSize: 18 }}>Everything you need to know about AdFlow Pro.</p>
        
        <div style={{ marginTop: 32, maxWidth: 500, margin: '32px auto 0' }}>
          <input 
            type="text" 
            placeholder="Search questions..." 
            className="input" 
            style={{ width: '100%', height: 50, borderRadius: 16, fontSize: 16 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredFaq.length > 0 ? (
          filteredFaq.map((item, i) => (
            <div key={i} className="card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#818cf8' }}>Q: {item.q}</h3>
              <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            No questions found matching your search.
          </div>
        )}
      </div>

      <div style={{ marginTop: 80, textAlign: 'center', padding: 40, background: 'rgba(99,102,241,0.05)', borderRadius: 24, border: '1px solid rgba(99,102,241,0.1)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Still have questions?</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Can't find the answer you're looking for? Our team is here to help.</p>
        <a href="mailto:support@adflowpro.pk" className="btn btn-primary">Contact Support</a>
      </div>
    </div>
  );
}
