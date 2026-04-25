'use client';

export default function PackagesPage() {
  const tiers = [
    {
      name: 'Basic',
      price: 'Free',
      period: '7 Days',
      features: [
        '5 Photos per ad',
        'Standard Visibility',
        'WhatsApp Contact Link',
        'Basic Support',
        '3 Active Ads'
      ],
      color: '#94a3b8',
      btnText: 'Start Free',
      recommended: false
    },
    {
      name: 'Standard',
      price: 'PKR 1,500',
      period: '15 Days',
      features: [
        '10 Photos per ad',
        'Enhanced Visibility',
        'Verified Seller Badge',
        'Priority Support',
        '10 Active Ads',
        'Ad Analytics'
      ],
      color: '#6366f1',
      btnText: 'Choose Standard',
      recommended: true
    },
    {
      name: 'Premium',
      price: 'PKR 3,000',
      period: '30 Days',
      features: [
        '15 Photos per ad',
        'Featured Status (Top of List)',
        'Verified Seller Badge',
        '24/7 VIP Support',
        'Unlimited Active Ads',
        'Advanced Analytics',
        'Video Links (YouTube)'
      ],
      color: '#f59e0b',
      btnText: 'Go Premium',
      recommended: false
    }
  ];

  return (
    <div className="container" style={{ padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16 }}>Choose Your Plan</h1>
        <p style={{ color: '#64748b', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
          Post your ads with the right visibility. Upgrade to get more views and sell faster.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        {tiers.map((tier, i) => (
          <div key={i} className="card" style={{ 
            padding: 48, 
            display: 'flex', 
            flexDirection: 'column', 
            border: tier.recommended ? `2px solid ${tier.color}` : '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            transform: tier.recommended ? 'scale(1.05)' : 'scale(1)',
            zIndex: tier.recommended ? 10 : 1
          }}>
            {tier.recommended && (
              <span style={{ 
                position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                background: tier.color, color: '#fff', padding: '6px 16px', borderRadius: 20,
                fontSize: 12, fontWeight: 800, textTransform: 'uppercase'
              }}>Most Popular</span>
            )}
            
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{tier.name}</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 32 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: tier.color }}>{tier.price}</span>
              <span style={{ color: '#64748b', fontSize: 14 }}>/ {tier.period}</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', flex: 1 }}>
              {tier.features.map((f, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: '#94a3b8' }}>
                  <span style={{ color: tier.color }}>✓</span> {f}
                </li>
              ))}
            </ul>

            <button 
              className="btn" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                background: tier.recommended ? tier.color : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: tier.recommended ? 'none' : '1px solid rgba(255,255,255,0.1)',
                fontWeight: 700
              }}
            >
              {tier.btnText}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 80, textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Need a custom solution for your business? <a href="mailto:sales@adflowpro.pk" style={{ color: '#818cf8', fontWeight: 600 }}>Contact Sales</a></p>
      </div>
    </div>
  );
}
