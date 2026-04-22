import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import FramerWrapper from '@/components/FramerWrapper';

export const metadata: Metadata = {
  title: { default: 'AdFlow Pro — Pakistan\'s Sponsored Ad Marketplace', template: '%s | AdFlow Pro' },
  description: 'Post, manage, and discover sponsored listings with powerful moderation, scheduling, and analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="hero-glow" />
        <Navbar />
        <FramerWrapper>
          <main style={{ paddingTop: '100px' }}>
            {children}
          </main>
        </FramerWrapper>
      </body>
    </html>
  );
}

