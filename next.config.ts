import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Tell Next.js these packages run on the server only (not bundled for edge/client)
  serverExternalPackages: ['pg', 'bcryptjs'],

  // Silence noisy image domain warnings during dev
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Strict mode catches common React bugs in dev
  reactStrictMode: true,
};

export default nextConfig;
