'use client';

import { ExploreAddButton } from '@/app/explore/components/ExploreAddButton';
import { type CatalogCharacter, fetchCharacters } from '@/client-api/characters';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function ExploreEmpty() {
  const t = useTranslations('explore');
  return <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{t('empty')}</p>;
}

interface ExploreListProps {
  characters: CatalogCharacter[];
}

function ExploreList({ characters }: ExploreListProps) {
  return (
    <ul>
      {characters.map((character) => (
        <li
          key={character.id}
          className={cn(
            'flex items-center justify-between gap-3 border-t border-border/50 px-4 py-3',
          )}
        >
          <Link
            href={`/explore/${character.id}`}
            transitionTypes={['nav-forward']}
            className={cn('min-w-0 flex-1')}
          >
            <p className={cn('truncate text-sm font-medium text-foreground')}>
              {character.name}
            </p>
            <p className={cn('truncate text-xs text-muted-foreground')}>{character.shortBio}</p>
          </Link>
          <ExploreAddButton
            characterId={character.id}
            isContact={character.isContact}
          />
        </li>
      ))}
    </ul>
  );
}

export function ExploreScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const { user } = useAuth();
  const t = useTranslations('explore');

  const charactersQuery = useQuery({
    queryKey: queryKeys.characters,
    queryFn: fetchCharacters,
    enabled: Boolean(user),
  });

  const characters = charactersQuery.data ?? [];

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} />

      <PageStatus
        loading={charactersQuery.isLoading}
        error={charactersQuery.isError}
        errorMessage={t('loadError')}
      >
        <div className={cn('flex-1 overflow-y-auto bg-background')}>
          {characters.length === 0 ? <ExploreEmpty /> : <ExploreList characters={characters} />}
        </div>
      </PageStatus>
    </div>
  );
}
