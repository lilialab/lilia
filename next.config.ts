import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['pino', 'pino-loki', 'thread-stream'],
};

export default nextConfig;
