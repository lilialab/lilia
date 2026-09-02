import { AppShell } from '@/components/AppShell';
import { I18nProvider } from '@/components/I18nProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { DEFAULT_LOCALE, localeToHtmlLang } from '@/i18n/config';
import { cn } from '@/lib/client/cn';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lilia',
  description: '带长期记忆的本地聊天应用',
  appleWebApp: {
    capable: true,
    title: 'Lilia',
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
    <html lang={localeToHtmlLang(DEFAULT_LOCALE)} className={cn('h-full antialiased')}>
      <body className={cn('min-h-full flex flex-col')}>
        <I18nProvider>
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
          <ToastProvider />
        </I18nProvider>
      </body>
    </html>
  );
}
