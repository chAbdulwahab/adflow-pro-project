'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  ad: { id: string; title: string; slug: string } | null;
  buyer:  { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const activeId     = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [newMessage,    setNewMessage]    = useState('');
  const [user,          setUser]          = useState<{ id: string } | null>(null);
  const [token,         setToken]         = useState('');
  const [isMobile,      setIsMobile]      = useState(false);
  // Mobile view: 'list' = sidebar, 'chat' = chat panel
  const [mobileView,    setMobileView]    = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('adflow_token');
    if (!t) { router.push('/login?callback=/dashboard/chat'); return; }
    setToken(t);
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      setUser(payload);
    } catch { router.push('/login'); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchConversations();
  }, [token]);

  // When activeId changes (URL), switch to chat view on mobile
  useEffect(() => {
    if (activeId && isMobile) setMobileView('chat');
  }, [activeId, isMobile]);

  useEffect(() => {
    if (!token || !activeId) return;
    fetchMessages(activeId);
    const interval = setInterval(() => fetchMessages(activeId), 5000);
    return () => clearInterval(interval);
  }, [token, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res  = await fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res  = await fetch(`/api/chat/conversations/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeId || sending) return;
    setSending(true);
    try {
      const res  = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.success) { setMessages([...messages, data.message]); setNewMessage(''); }
    } catch { alert('Failed to send message'); }
    finally { setSending(false); }
  };

  const handleSelectConversation = (convId: string) => {
    router.push(`/dashboard/chat?id=${convId}`);
    setConversations(conversations.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
    if (isMobile) setMobileView('chat');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const activeConv = conversations.find(c => c.id === activeId);

  // ── Shared colours (theme-safe) ──────────────────────────────────────
  const convBorder   = 'var(--border)';
  const convHoverBg  = 'var(--surface)';
  const convActiveBg = 'rgba(99,102,241,0.1)';
  const msgBubbleBg  = 'var(--surface)';
  const inputBg      = 'var(--surface)';

  // ── Sidebar ───────────────────────────────────────────────────────────
  const Sidebar = (
    <div className="card" style={{
      width: isMobile ? '100%' : 300,
      display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
      flexDirection: 'column',
      padding: 0,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Sidebar header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${convBorder}` }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Messages</h2>
        <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 2 }}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>💬</p>
            <p style={{ color: 'var(--dim)', fontSize: 14 }}>No conversations yet.</p>
          </div>
        ) : (
          conversations.map(c => {
            const otherUser = c.buyer.id === user?.id ? c.seller : c.buyer;
            const isActive  = c.id === activeId;
            return (
              <div
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  background: isActive ? convActiveBg : 'transparent',
                  borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`,
                  borderBottom: `1px solid ${convBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = convHoverBg)}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#6366f1,#a78bfa)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12, color: '#fff',
                    }}>
                      {otherUser.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: isActive ? '#818cf8' : 'var(--text)', fontSize: 14, marginBottom: 1 }}>
                        {otherUser.name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 220 : 160 }}>
                        {c.ad?.title || 'Ad deleted'}
                      </p>
                    </div>
                  </div>
                </div>
                {!isActive && c.unread_count > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 10, marginLeft: 6, flexShrink: 0 }}>
                    {c.unread_count}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Chat Panel ────────────────────────────────────────────────────────
  const ChatPanel = (
    <div className="card" style={{
      flex: 1,
      display: isMobile && mobileView === 'list' ? 'none' : 'flex',
      flexDirection: 'column',
      padding: 0,
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {activeConv ? (
        <>
          {/* Chat header */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${convBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Back button on mobile */}
            {isMobile && (
              <button
                onClick={() => setMobileView('list')}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px 0 0', flexShrink: 0 }}
                aria-label="Back to conversations"
              >
                ←
              </button>
            )}
            {/* Other user avatar */}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>
              {(activeConv.buyer.id === user?.id ? activeConv.seller.name : activeConv.buyer.name)?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                {activeConv.buyer.id === user?.id ? activeConv.seller.name : activeConv.buyer.name}
              </p>
              {activeConv.ad && (
                <p style={{ fontSize: 11, color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Re: <a href={`/ads/${activeConv.ad.slug}`} style={{ color: 'inherit' }}>{activeConv.ad.title}</a>
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 14px' : 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <p style={{ color: 'var(--dim)', textAlign: 'center', fontSize: 13, marginTop: 40 }}>No messages yet. Say hello! 👋</p>
            )}
            {messages.map(m => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: isMobile ? '85%' : '70%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 16,
                    background: isMe ? '#6366f1' : msgBubbleBg,
                    color: isMe ? '#fff' : 'var(--text)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    border: isMe ? 'none' : `1px solid ${convBorder}`,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius:  isMe ? 16 : 4,
                    wordBreak: 'break-word',
                  }}>
                    {m.content}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--dim)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSendMessage} style={{ padding: isMobile ? '12px 14px' : '16px 20px', borderTop: `1px solid ${convBorder}`, display: 'flex', gap: 10, flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Type your message…"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              style={{
                flex: 1, padding: '11px 14px', borderRadius: 12,
                background: inputBg, border: `1px solid ${convBorder}`,
                color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              disabled={sending || !newMessage.trim()}
              className="btn btn-primary"
              style={{ padding: isMobile ? '0 16px' : '0 22px', flexShrink: 0, opacity: (!newMessage.trim() || sending) ? 0.5 : 1 }}
            >
              {sending ? '…' : isMobile ? '↑' : 'Send'}
            </button>
          </form>
        </>
      ) : (
        /* No conversation selected */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>💬</p>
          <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
            {conversations.length === 0 ? 'No conversations yet' : 'Select a conversation'}
          </p>
          <p style={{ color: 'var(--dim)', fontSize: 14 }}>
            {conversations.length === 0
              ? 'Start a chat by clicking "Chat with Seller" on any ad listing.'
              : 'Choose a conversation from the left to start messaging.'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="container" style={{
      padding: isMobile ? '0' : '32px 24px',
      height: isMobile ? 'calc(100vh - 70px)' : 'calc(100vh - 100px)',
      display: 'flex',
      gap: isMobile ? 0 : 20,
    }}>
      {Sidebar}
      {ChatPanel}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
