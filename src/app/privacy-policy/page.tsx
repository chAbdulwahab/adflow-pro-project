export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 40 }}>Privacy Policy</h1>
      
      <div style={{ color: '#e2e8f0', lineHeight: 1.8, fontSize: 16 }}>
        <p style={{ marginBottom: 24 }}>Last Updated: April 25, 2026</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, post an advertisement, or communicate with us. This includes your name, email address, phone number, and any details included in your listings.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 12 }}>
            <li>Provide and maintain the AdFlow Pro marketplace.</li>
            <li>Process transactions and verify payments.</li>
            <li>Protect users from fraud and abuse.</li>
            <li>Send you technical notices, updates, and support messages.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>3. Information Sharing</h2>
          <p>We do not sell your personal data. Your contact information (phone number) is shared with other users only when you publish an advertisement, to facilitate communication between buyers and sellers.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>4. Data Security</h2>
          <p>We use industry-standard security measures to protect your information. Your data is stored securely using Supabase and is protected by encrypted authentication tokens.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at support@adflowpro.pk.</p>
        </section>
      </div>
    </div>
  );
}
