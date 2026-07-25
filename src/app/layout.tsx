import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { cn } from '@/lib/client/cn';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'pai-arbor',
  description: '本地 RAG 聊天应用',
  appleWebApp: {
    capable: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN" className={cn('h-full antialiased')}>
      <body className={cn('min-h-full flex flex-col')}>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
