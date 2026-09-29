'use client';

import { ExploreAddButton } from '@/app/explore/components/ExploreAddButton';
import {
  type CatalogCharacter,
  characterAvatarUrl,
  fetchCharacters,
} from '@/client-api/characters';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequiredUser } from '@/hooks/useRequiredUser';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function ExploreCreateButton() {
  const t = useTranslations('explore');
  return (
    <div className={cn('bg-background px-4 py-4')}>
      <Link
        href="/explore/new"
        transitionTypes={['nav-forward']}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-md border border-border',
          'bg-background py-2.5 text-sm font-medium text-foreground',
          'hover:bg-row-hover active:bg-row-hover',
        )}
      >
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-sm bg-foreground text-background',
          )}
        >
          <Plus className={cn('h-3.5 w-3.5')} aria-hidden />
        </span>
        {t('create')}
      </Link>
    </div>
  );
}

interface ExploreListProps {
  characters: CatalogCharacter[];
}

function ExploreList({ characters }: ExploreListProps) {
  const t = useTranslations('explore');
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
            className={cn('flex min-w-0 flex-1 items-center gap-3')}
          >
            <Avatar
              src={characterAvatarUrl(character.id, character.avatarUpdatedAt)}
              hasAvatar={character.hasAvatar}
              name={character.name}
            />
            <div className={cn('min-w-0')}>
              <div className={cn('flex min-w-0 items-center gap-1.5')}>
                <p className={cn('truncate text-sm font-medium text-foreground')}>
                  {character.name}
                </p>
                {character.isOfficial && <Badge color="blue">{t('official')}</Badge>}
              </div>
              <p className={cn('truncate text-xs text-muted-foreground')}>
                {character.shortBio}
              </p>
            </div>
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

  const user = useRequiredUser();
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
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto')}>
          <ExploreCreateButton />
          <div className={cn('mt-3 bg-background')}>
            <ExploreList characters={characters} />
          </div>
        </div>
      </PageStatus>
    </div>
  );
}
