'use client';

import { type CharacterSummary, fetchCharacters } from '@/client-api/characters';
import { addContact, fetchContacts } from '@/client-api/contacts';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/translate-api-error';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function AvailableCharactersEmpty() {
  const t = useTranslations('addContact');
  return <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{t('empty')}</p>;
}

interface AvailableCharactersListProps {
  characters: CharacterSummary[];
}

function AvailableCharactersList({ characters }: AvailableCharactersListProps) {
  const queryClient = useQueryClient();
  const t = useTranslations('addContact');

  const addMutation = useMutation({
    mutationFn: addContact,
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.contacts, exact: true });
      showSuccessToast(t('addedToast', { name: contact.displayName }));
    },
    onError: (err) => {
      showErrorToast(translateApiError(err), 'contact-add');
    },
  });

  return (
    <ul>
      {characters.map((character) => (
        <li
          key={character.id}
          className={cn(
            'flex items-center justify-between gap-3 border-t border-border/50 px-4 py-3',
          )}
        >
          <div className={cn('min-w-0')}>
            <p className={cn('truncate text-sm font-medium text-foreground')}>
              {character.displayName}
            </p>
            <p className={cn('truncate text-xs text-muted-foreground')}>{character.slug}</p>
          </div>
          <button
            type="button"
            disabled={addMutation.isPending}
            onClick={() => addMutation.mutate(character.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md border border-border',
              'px-2.5 py-1.5 text-xs text-foreground/80 hover:bg-surface disabled:opacity-40',
            )}
          >
            <UserPlus className={cn('h-3.5 w-3.5')} aria-hidden />
            {t('add')}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AddContactScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('addContact');

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

  const isBootstrapping = contactsQuery.isLoading || charactersQuery.isLoading;

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
      />

      <PageStatus
        loading={isBootstrapping}
        error={contactsQuery.isError || charactersQuery.isError}
        errorMessage={t('loadError')}
      >
        <div className={cn('flex-1 overflow-y-auto bg-background')}>
          {availableCharacters.length === 0
            ? <AvailableCharactersEmpty />
            : <AvailableCharactersList characters={availableCharacters} />}
        </div>
      </PageStatus>
    </div>
  );
}
