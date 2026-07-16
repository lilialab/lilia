'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { fetchCharacters } from '@/lib/client/api/characters';
import { addContact, fetchContacts } from '@/lib/client/api/contacts';
import { queryKeys } from '@/lib/client/query-keys';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';

export function AddContactScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts,
    queryFn: fetchContacts,
    enabled: Boolean(user),
  });

  const charactersQuery = useQuery({
    queryKey: queryKeys.characters,
    queryFn: fetchCharacters,
    enabled: Boolean(user),
  });

  const contactIds = useMemo(
    () => new Set((contactsQuery.data ?? []).map((c) => c.id)),
    [contactsQuery.data],
  );

  const availableCharacters = useMemo(
    () => (charactersQuery.data ?? []).filter((c) => !contactIds.has(c.id)),
    [charactersQuery.data, contactIds],
  );

  const addMutation = useMutation({
    mutationFn: addContact,
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.contacts, exact: true });
      toast.success(`已添加 ${contact.displayName}`);
    },
    onError: (err) => {
      showErrorToast(formatClientError(err), 'contact-add');
    },
  });

  useEffect(() => {
    if (!isAuthLoading && user === null) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  if (!isAuthLoading && user === null) {
    return null;
  }

  const isBootstrapping = isAuthLoading || contactsQuery.isLoading || charactersQuery.isLoading;

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <header
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 py-3',
        )}
      >
        <button
          type="button"
          onClick={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
          className={cn(
            'inline-flex items-center gap-0.5 rounded-md px-1.5 py-1.5 text-sm text-zinc-600',
            'hover:bg-zinc-50',
          )}
          aria-label="返回通讯录"
        >
          <ChevronLeft className={cn('h-5 w-5')} aria-hidden />
        </button>
        <h1 className={cn('text-base font-medium text-zinc-900')}>添加 AI</h1>
        <div className={cn('w-10')} aria-hidden />
      </header>

      {isBootstrapping ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          加载中...
        </div>
      ) : contactsQuery.isError || charactersQuery.isError ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          无法加载角色列表
        </div>
      ) : (
        <div className={cn('flex-1 overflow-y-auto bg-white')}>
          {availableCharacters.length === 0 ? (
            <p className={cn('px-4 py-6 text-sm text-zinc-400')}>没有可添加的角色</p>
          ) : (
            <ul>
              {availableCharacters.map((character) => (
                <li
                  key={character.id}
                  className={cn(
                    'flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3',
                  )}
                >
                  <div className={cn('min-w-0')}>
                    <p className={cn('truncate text-sm font-medium text-zinc-900')}>
                      {character.displayName}
                    </p>
                    <p className={cn('truncate text-xs text-zinc-500')}>{character.slug}</p>
                  </div>
                  <button
                    type="button"
                    disabled={addMutation.isPending}
                    onClick={() => addMutation.mutate(character.id)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200',
                      'px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-40',
                    )}
                  >
                    <UserPlus className={cn('h-3.5 w-3.5')} aria-hidden />
                    添加
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
