'use client';

import { useI18n, useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { localeLabels, locales } from '@/i18n/config';
import { cn } from '@/lib/client/cn';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SettingsScreen() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();
  const t = useTranslations('settings');

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/me', { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto')}>
        <section className={cn('mt-3 bg-background')}>
          <div className={cn('px-4 py-2 text-xs text-muted-foreground')}>{t('language')}</div>
          <ul>
            {locales.map((option) => {
              const selected = option === locale;
              return (
                <li key={option} className={cn('border-t border-border/50')}>
                  <button
                    type="button"
                    onClick={() => setLocale(option)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-sm',
                      'hover:bg-surface',
                      selected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    <span>{localeLabels[option]}</span>
                    {selected && <Check className={cn('h-4 w-4 shrink-0')} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
