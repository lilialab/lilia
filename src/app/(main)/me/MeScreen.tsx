'use client';

import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/client/cn';
import { LogOut } from 'lucide-react';

export function MeScreen() {
  const { user, isLoading: isAuthLoading, isUnauthenticated, logout, isLoggingOut } =
    useRequireAuth();

  if (isUnauthenticated) {
    return null;
  }

  return (
    <div className={cn('flex h-full flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader title="我" />

      <PageStatus loading={isAuthLoading}>
        <div className={cn('flex-1 overflow-y-auto')}>
          <section className={cn('mt-3 bg-white px-4 py-4')}>
            <p className={cn('text-base font-medium text-zinc-900')}>
              {user?.displayName ?? '...'}
            </p>
            {user?.username && (
              <p className={cn('mt-1 text-sm text-zinc-500')}>@{user.username}</p>
            )}
          </section>

          <section className={cn('mt-3 bg-white')}>
            <button
              type="button"
              onClick={logout}
              disabled={isLoggingOut}
              className={cn(
                'flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm text-red-600',
                'hover:bg-zinc-50 disabled:opacity-40',
              )}
            >
              <LogOut className={cn('h-4 w-4')} aria-hidden />
              {isLoggingOut ? '退出中...' : '退出登录'}
            </button>
          </section>
        </div>
      </PageStatus>
    </div>
  );
}
