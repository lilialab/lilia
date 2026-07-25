import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // 手机/局域网用 192.168.x.x 访问时放行 /_next（否则 JS 不水合，登录会整页刷新）
  allowedDevOrigins: ['192.168.*.*'],
  experimental: {
    viewTransition: true,
  },
  serverExternalPackages: ['pino', 'pino-loki', 'thread-stream'],
};

export default nextConfig;
