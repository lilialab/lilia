'use client';

import { languagePageHref, type LanguageReturnPath } from '@/app/language/language-return';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { Languages } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthLocaleLinkProps {
  returnTo: LanguageReturnPath;
}

function AuthLocaleLink({ returnTo }: AuthLocaleLinkProps) {
  const t = useTranslations('auth');

  return (
    <Link
      href={languagePageHref(returnTo)}
      transitionTypes={['nav-forward']}
      aria-label={t('languageAria')}
      className={cn(
        'absolute right-3 top-3 flex min-h-10 min-w-10 items-center justify-center rounded-md',
        'border border-border bg-surface text-foreground/80',
        'hover:bg-row-hover hover:text-foreground active:bg-row-hover active:text-foreground',
      )}
    >
      <Languages className={cn('h-5 w-5')} aria-hidden />
    </Link>
  );
}

interface AuthShellProps {
  title: string;
  returnTo: LanguageReturnPath;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, returnTo, children, footer }: AuthShellProps) {
  return (
    <div className={cn('flex min-h-dvh items-center justify-center bg-surface px-4')}>
      <div
        className={cn(
          'relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-sm',
        )}
      >
        <AuthLocaleLink returnTo={returnTo} />
        <h1 className={cn('mb-6 text-center text-xl font-semibold text-foreground')}>{title}</h1>
        {children}
        {footer && (
          <div className={cn('mt-6 text-center text-sm text-muted-foreground')}>{footer}</div>
        )}
      </div>
    </div>
  );
}
