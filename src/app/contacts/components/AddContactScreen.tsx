'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { fetchCharacters, type CharacterSummary } from '@/lib/client/api/characters';
import { addContact, fetchContacts } from '@/lib/client/api/contacts';
import { queryKeys } from '@/lib/client/query-keys';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';

function AvailableCharactersEmpty() {
  return <p className={cn('px-4 py-6 text-sm text-zinc-400')}>没有可添加的角色</p>;
}

function AvailableCharactersList({ characters }: { characters: CharacterSummary[] }) {
  const queryClient = useQueryClient();

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

  return (
    <ul>
      {characters.map((character) => (
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
  );
}

export function AddContactScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isUnauthenticated } = useRequireAuth();

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

  if (isUnauthenticated) {
    return null;
  }

  const isBootstrapping = isAuthLoading || contactsQuery.isLoading || charactersQuery.isLoading;

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader
        title="添加 AI"
        onBack={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
      />

      <PageStatus
        loading={isBootstrapping}
        error={contactsQuery.isError || charactersQuery.isError}
        errorMessage="无法加载角色列表"
      >
        <div className={cn('flex-1 overflow-y-auto bg-white')}>
          {availableCharacters.length === 0 ? (
            <AvailableCharactersEmpty />
          ) : (
            <AvailableCharactersList characters={availableCharacters} />
          )}
        </div>
      </PageStatus>
    </div>
  );
}
