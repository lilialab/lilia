'use client';

import { updateUserLocale } from '@/client-api/auth';
import { useI18n, useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { type Locale, localeLabels, locales } from '@/i18n/config';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { LanguageReturnPath } from './language-return';

interface LanguageScreenProps {
  returnTo: LanguageReturnPath;
}

/** 从设置进入语言页时视为已登录，可双写 DB；login/register 入口只写 Cookie。 */
function shouldPersistLocaleToDb(returnTo: LanguageReturnPath): boolean {
  return returnTo === '/me/settings';
}

export function LanguageScreen({ returnTo }: LanguageScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale, setLocale } = useI18n();
  const t = useTranslations('settings');

  const handleSelect = useCallback(async (option: Locale) => {
    if (option === locale) return;

    setLocale(option);

    if (!shouldPersistLocaleToDb(returnTo)) return;

    try {
      await updateUserLocale(option);
      await queryClient.invalidateQueries({ queryKey: queryKeys.authMe });
    } catch (error) {
      showErrorToast(translateApiError(error));
    }
  }, [locale, queryClient, returnTo, setLocale]);

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('language')}
        onBack={() => router.push(returnTo, { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto')}>
        <ul className={cn('mt-3 bg-background')}>
          {locales.map((option) => {
            const selected = option === locale;
            return (
              <li key={option} className={cn('border-t border-border/50')}>
                <button
                  type="button"
                  onClick={() => void handleSelect(option)}
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-sm',
                    'hover:bg-row-hover',
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
      </div>
    </div>
  );
}
