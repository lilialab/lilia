'use client';

import { languagePageHref } from '@/app/language/language-return';
import { privacyPageHref } from '@/app/privacy/privacy-return';
import { useI18n, useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { localeLabels } from '@/i18n/config';
import { cn } from '@/lib/client/cn';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface SettingsRowProps {
  href: string;
  label: string;
  trailing?: ReactNode;
  destructive?: boolean;
}

/** 设置页菜单行：文案 + 右侧（默认箭头）。 */
function SettingsRow({ href, label, trailing, destructive }: SettingsRowProps) {
  return (
    <Link
      href={href}
      transitionTypes={['nav-forward']}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-sm hover:bg-row-hover active:bg-row-hover',
        destructive ? 'text-destructive' : 'text-foreground',
      )}
    >
      <span>{label}</span>
      {trailing ?? (
        <ChevronRight
          className={cn(
            'h-4 w-4',
            destructive ? 'text-destructive/70' : 'text-muted-foreground',
          )}
          aria-hidden
        />
      )}
    </Link>
  );
}

interface SettingsScreenProps {
  version: string;
}

export function SettingsScreen({ version }: SettingsScreenProps) {
  const router = useRouter();
  const t = useTranslations('settings');
  const { locale } = useI18n();

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/me', { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto')}>
        <section className={cn('mt-3 divide-y divide-border/50 bg-background')}>
          <SettingsRow href="/me/settings/nickname" label={t('changeNickname')} />
          <SettingsRow href="/me/settings/password" label={t('changePassword')} />
          <SettingsRow href="/me/settings/llm" label={t('llmConfig')} />
          <SettingsRow
            href={languagePageHref('/me/settings')}
            label={t('language')}
            trailing={
              <span className={cn('flex items-center gap-1 text-muted-foreground')}>
                {localeLabels[locale]}
                <ChevronRight className={cn('h-4 w-4')} aria-hidden />
              </span>
            }
          />
        </section>

        <section className={cn('mt-3 bg-background')}>
          <SettingsRow href={privacyPageHref('/me/settings')} label={t('privacyPolicy')} />
        </section>

        <section className={cn('mt-3 bg-background')}>
          <SettingsRow
            href="/me/settings/delete-account"
            label={t('deleteAccount')}
            destructive
          />
        </section>

        <p className={cn('px-4 py-6 text-center text-xs text-muted-foreground')}>
          {t('appVersion', { version })}
        </p>
      </div>
    </div>
  );
}
