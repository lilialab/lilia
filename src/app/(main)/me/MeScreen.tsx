'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/app/chat/hooks/useAuth';
import { cn } from '@/lib/client/cn';

export function MeScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout, isLoggingOut } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && user === null) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  if (!isAuthLoading && user === null) {
    return null;
  }

  return (
    <div className={cn('flex h-full flex-col bg-zinc-50 text-zinc-900')}>
      <header
        className={cn(
          'flex shrink-0 items-center justify-center border-b border-zinc-200 bg-white px-3 py-3',
        )}
      >
        <h1 className={cn('text-base font-medium text-zinc-900')}>我</h1>
      </header>

      {isAuthLoading ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          加载中...
        </div>
      ) : (
        <div className={cn('flex-1 overflow-y-auto')}>
          <section className={cn('mt-3 bg-white px-4 py-4')}>
            <p className={cn('text-base font-medium text-zinc-900')}>
              {user?.displayName ?? '...'}
            </p>
            {user?.username ? (
              <p className={cn('mt-1 text-sm text-zinc-500')}>@{user.username}</p>
            ) : null}
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
      )}
    </div>
  );
}
