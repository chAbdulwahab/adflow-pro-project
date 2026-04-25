'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQ_DATA } from '@/constants/faq';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AdFlow Pro assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested questions (random 4 from FAQ)
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Pick 4 random suggested questions
    const shuffled = [...FAQ_DATA].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 4).map(f => f.q));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const findFaqMatch = (query: string) => {
    const q = query.toLowerCase().trim();
    // 1. Exact match
    const exact = FAQ_DATA.find(f => f.q.toLowerCase() === q);
    if (exact) return exact.a;

    // 2. Keyword match (simple scoring)
    const words = q.split(/\s+/).filter(w => w.length > 3);
    if (words.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;

    for (const faq of FAQ_DATA) {
      let score = 0;
      const faqLower = faq.q.toLowerCase();
      for (const word of words) {
        if (faqLower.includes(word)) score++;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq.a;
      }
    }

    // Only return if at least 50% of significant words match
    return (highestScore >= words.length / 2) ? bestMatch : null;
  };

  const handleSend = async (val: string) => {
    const text = val.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    // 1. Check FAQ first
    const faqAnswer = findFaqMatch(text);
    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: faqAnswer }]);
        setLoading(false);
      }, 500); // Artificial delay for realism
      return;
    }

    // 2. Fallback to AI API
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m not sure about that. Could you please rephrase or contact our support team?' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000, fontFamily: 'inherit' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              width: 380,
              height: 520,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginBottom: 20
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px 24px', 
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(56,189,248,0.2))',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>AI Assistant</h3>
                  <p style={{ fontSize: 11, color: '#22c55e', margin: 0 }}>● Online</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setMessages([{ role: 'assistant', content: 'Hi! I\'m your AdFlow Pro assistant. How can I help you today?' }]);
                    setShowSuggestions(true);
                  }}
                  title="Clear Chat"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: 4 }}
                >🗑️</button>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: 4 }}
                >×</button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 18,
                    fontSize: 14,
                    lineHeight: 1.5,
                    background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                    borderBottomLeftRadius: m.role === 'user' ? 18 : 4,
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)' }}>
                  <div className="typing-dot" />
                </div>
              )}

              {showSuggestions && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested Questions</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(s)}
                        style={{ 
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', 
                          color: '#818cf8', fontSize: 12, padding: '6px 12px', borderRadius: 20, 
                          cursor: 'pointer', transition: 'all 0.2s' 
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
              <input 
                type="text" 
                placeholder="Ask me anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
              <button 
                disabled={loading || !input.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#6366f1',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? '...' : '→'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
          border: 'none',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(99,102,241,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isOpen ? '×' : '🤖'}
      </motion.button>

      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
