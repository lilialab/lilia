'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchContacts } from '@/lib/client/api/contacts';
import { queryKeys } from '@/lib/client/query-keys';
import { cn } from '@/lib/client/cn';

export function ContactsScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!isAuthLoading && user === null) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  const openChat = useCallback(
    (characterId: string) => {
      router.push(`/chat/${characterId}`, { transitionTypes: ['nav-forward'] });
    },
    [router],
  );

  const openAdd = useCallback(() => {
    router.push('/chat/add', { transitionTypes: ['nav-forward'] });
  }, [router]);

  if (!isAuthLoading && user === null) {
    return null;
  }

  const isBootstrapping = isAuthLoading || contactsQuery.isLoading;

  return (
    <div className={cn('flex h-full flex-col bg-zinc-50 text-zinc-900')}>
      <header
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 py-3',
        )}
      >
        <div className={cn('w-10')} aria-hidden />
        <h1 className={cn('text-base font-medium text-zinc-900')}>通讯录</h1>
        <button
          type="button"
          onClick={openAdd}
          className={cn(
            'flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-500',
            'hover:bg-zinc-100 hover:text-zinc-700',
          )}
          aria-label="添加 AI"
        >
          <UserPlus className={cn('h-5 w-5')} aria-hidden />
        </button>
      </header>

      {isBootstrapping ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          加载中...
        </div>
      ) : contactsQuery.isError ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          无法加载通讯录
        </div>
      ) : (
        <div className={cn('flex-1 overflow-y-auto')}>
          <section className={cn('bg-white')}>
            <h2 className={cn('px-4 py-2 text-xs font-medium text-zinc-500')}>我的 AI</h2>
            {(contactsQuery.data ?? []).length === 0 ? (
              <p className={cn('px-4 py-6 text-sm text-zinc-400')}>还没有 AI 好友，点右上角添加</p>
            ) : (
              <ul>
                {(contactsQuery.data ?? []).map((contact) => (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => openChat(contact.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-3 text-left',
                        'hover:bg-zinc-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          'bg-zinc-200 text-sm font-medium text-zinc-700',
                        )}
                      >
                        {contact.displayName.slice(0, 1)}
                      </span>
                      <span className={cn('min-w-0')}>
                        <span className={cn('block truncate text-sm font-medium text-zinc-900')}>
                          {contact.displayName}
                        </span>
                        <span className={cn('block truncate text-xs text-zinc-500')}>
                          {contact.slug}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
