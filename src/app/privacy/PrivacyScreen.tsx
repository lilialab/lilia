'use client';

import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { cn } from '@/lib/client/cn';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { PrivacyReturnPath } from './privacy-return';

interface PrivacyScreenProps {
  returnTo: PrivacyReturnPath;
  children: ReactNode;
}

/** 公开隐私页壳：顶栏随语言，按入口回跳注册或设置。 */
export function PrivacyScreen({ returnTo, children }: PrivacyScreenProps) {
  const router = useRouter();
  const t = useTranslations('settings');

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('privacyPolicy')}
        onBack={() => router.push(returnTo, { transitionTypes: ['nav-back'] })}
      />
      <div className={cn('min-h-0 flex-1 overflow-y-auto')}>{children}</div>
    </div>
  );
}
