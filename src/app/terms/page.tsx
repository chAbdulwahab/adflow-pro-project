export default function TermsOfService() {
  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 40 }}>Terms of Service</h1>
      
      <div style={{ color: '#e2e8f0', lineHeight: 1.8, fontSize: 16 }}>
        <p style={{ marginBottom: 24 }}>Welcome to AdFlow Pro. By using our website, you agree to these terms.</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>1. Acceptable Use</h2>
          <p>You agree not to post any content that is illegal, misleading, or violates the rights of others. We reserve the right to remove any advertisements that violate our quality guidelines.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>2. Account Responsibility</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>3. Payments and Packages</h2>
          <p>Payments for Standard and Premium packages are non-refundable once the ad has been verified and published. Ads will remain active for the duration specified in the chosen package.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>4. Limitation of Liability</h2>
          <p>AdFlow Pro is a marketplace platform. We are not responsible for the quality, safety, or legality of the items advertised, nor the truth or accuracy of the listings.</p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>5. Changes to Terms</h2>
          <p>We may update these terms from time to time. Your continued use of the platform after changes are posted constitutes your acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  );
}
