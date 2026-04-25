import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backdropFilter: 'blur(10px)',
      padding: '80px 24px 40px',
      marginTop: 100,
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 60 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>A</div>
              <span className="footer-brand-text" style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0' }}>
                AdFlow <span style={{ color: '#818cf8' }}>Pro</span>
              </span>
            </div>
            <p className="footer-copy" style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              Pakistan's premium sponsored ad marketplace. Buy, sell, and grow your business with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-heading" style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Marketplace</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><Link href="/explore"  className="footer-link" style={{ color: '#94a3b8', fontSize: 14 }}>Explore Ads</Link></li>
              <li><Link href="/packages" className="footer-link" style={{ color: '#94a3b8', fontSize: 14 }}>Pricing Plans</Link></li>
              <li><Link href="/register" className="footer-link" style={{ color: '#94a3b8', fontSize: 14 }}>Become a Seller</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="footer-heading" style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><Link href="/faq"            className="footer-link" style={{ color: '#94a3b8', fontSize: 14 }}>Help Center / FAQ</Link></li>
              <li><Link href="/privacy-policy" className="footer-link" style={{ color: '#94a3b8', fontSize: 14 }}>Privacy Policy</Link></li>
              <li><Link href="/terms"          className="footer-link" style={{ color: '#94a3b8', fontSize: 14 }}>Terms of Service</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="footer-heading" style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Follow Us</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="#" style={{ fontSize: 20 }}>📘</a>
              <a href="#" style={{ fontSize: 20 }}>📸</a>
              <a href="#" style={{ fontSize: 20 }}>🐦</a>
              <a href="#" style={{ fontSize: 20 }}>📺</a>
            </div>
          </div>
        </div>

        <div className="footer-divider" style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 40,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <p className="footer-copy" style={{ color: '#475569', fontSize: 13 }}>
            © {currentYear} AdFlow Pro. All rights reserved. Built for high performance.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/privacy-policy" className="footer-copy" style={{ color: '#475569', fontSize: 12 }}>Privacy</Link>
            <Link href="/terms"          className="footer-copy" style={{ color: '#475569', fontSize: 12 }}>Terms</Link>
            <Link href="/cookies"        className="footer-copy" style={{ color: '#475569', fontSize: 12 }}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
