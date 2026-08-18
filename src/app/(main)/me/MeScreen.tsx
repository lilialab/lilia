'use client';

import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { LogOut, Settings } from 'lucide-react';
import { MeMenuLink } from './MeMenuLink';

export function MeScreen() {
  const { user, logout, isLoggingOut } = useAuth();
  const t = useTranslations('me');

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} />

      <div className={cn('flex-1 overflow-y-auto')}>
        <section className={cn('mt-3 bg-background px-4 py-4')}>
          <p className={cn('text-base font-medium text-foreground')}>
            {user?.displayName ?? '...'}
          </p>
          {user?.username && (
            <p className={cn('mt-1 text-sm text-muted-foreground')}>@{user.username}</p>
          )}
        </section>

        <section className={cn('mt-3 bg-background')}>
          <MeMenuLink href="/me/settings" label={t('settings')} icon={Settings} />
        </section>

        <section className={cn('mt-3 bg-background')}>
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className={cn(
              'flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm text-destructive',
              'hover:bg-surface disabled:opacity-40',
            )}
          >
            <LogOut className={cn('h-4 w-4')} aria-hidden />
            {isLoggingOut ? t('loggingOut') : t('logout')}
          </button>
        </section>
      </div>
    </div>
  );
}
