import { AppShell } from '@/components/AppShell';
import { I18nProvider } from '@/components/I18nProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { LOCALE_COOKIE_NAME, localeToHtmlLang, parseLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/get-messages';
import { cn } from '@/lib/client/cn';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
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

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const messages = getMessages(locale);

  return (
    <html lang={localeToHtmlLang(locale)} className={cn('h-full antialiased')}>
      <body className={cn('min-h-full flex flex-col')}>
        <I18nProvider locale={locale} messages={messages}>
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
          <ToastProvider />
        </I18nProvider>
      </body>
    </html>
  );
}
