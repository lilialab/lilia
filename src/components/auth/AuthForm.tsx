'use client';

import { languagePageHref, type LanguageReturnPath } from '@/app/language/language-return';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { Languages } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
}: AuthFieldProps) {
  return (
    <label htmlFor={id} className={cn('flex flex-col gap-1.5')}>
      <span className={cn('text-sm font-medium text-foreground/80')}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
          'outline-none focus:border-muted-foreground',
        )}
      />
    </label>
  );
}

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
        'hover:bg-chat hover:text-foreground',
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
