'use client';

import { useI18n, useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { localeLabels } from '@/i18n/config';
import { languagePageHref } from '@/i18n/language-return';
import { cn } from '@/lib/client/cn';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SettingsScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const t = useTranslations('settings');

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/me', { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto')}>
        <section className={cn('mt-3 bg-background')}>
          <Link
            href={languagePageHref('/me/settings')}
            transitionTypes={['nav-forward']}
            className={cn(
              'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-sm text-foreground',
              'hover:bg-surface',
            )}
          >
            <span>{t('language')}</span>
            <span className={cn('flex items-center gap-1 text-muted-foreground')}>
              {localeLabels[locale]}
              <ChevronRight className={cn('h-4 w-4')} aria-hidden />
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}
