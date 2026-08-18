'use client';

import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { MessagesSquare, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/contacts', labelKey: 'contacts', icon: Users },
  { href: '/groups', labelKey: 'groups', icon: MessagesSquare },
  { href: '/me', labelKey: 'me', icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const t = useTranslations('tabBar');

  return (
    <nav
      className={cn(
        'flex shrink-0 border-t border-border bg-background',
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-label={t('navAriaLabel')}
    >
      {TABS.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            transitionTypes={['tab']}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground/70',
            )}
          >
            <Icon className={cn('h-6 w-6')} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
