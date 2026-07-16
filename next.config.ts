import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    viewTransition: true,
  },
  serverExternalPackages: ['pino', 'pino-loki', 'thread-stream'],
};

export default nextConfig;
