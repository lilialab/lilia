'use client';

import { CharacterFacts } from '@/app/explore/components/CharacterFacts';
import { ExploreAddButton } from '@/app/explore/components/ExploreAddButton';
import { ExploreCommentComposer, ExploreComments } from '@/app/explore/components/ExploreComments';
import { ExploreDeleteButton } from '@/app/explore/components/ExploreDeleteButton';
import { characterAvatarUrl, fetchCharacter } from '@/client-api/characters';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface ExploreCharacterScreenProps {
  characterId: string;
}

export function ExploreCharacterScreen({ characterId }: ExploreCharacterScreenProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('explore');

  const characterQuery = useQuery({
    queryKey: queryKeys.character(characterId),
    queryFn: () => fetchCharacter(characterId),
    enabled: Boolean(user),
  });

  const character = characterQuery.data;
  const goBack = () => router.push('/explore', { transitionTypes: ['nav-back'] });
  const goEdit = () => {
    router.push(`/explore/${characterId}/edit`, { transitionTypes: ['nav-forward'] });
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader title={character?.name ?? t('title')} onBack={goBack} />

      <PageStatus
        loading={characterQuery.isLoading}
        error={characterQuery.isError}
        errorMessage={t('notFound')}
        actionLabel={t('backToList')}
        onAction={goBack}
      >
        {character && (
          <div className={cn('flex min-h-0 flex-1 flex-col')}>
            <div className={cn('flex-1 overflow-y-auto')}>
              <section className={cn('mt-3 bg-background px-4 py-4')}>
                <div className={cn('flex items-center gap-4')}>
                  <Avatar
                    src={characterAvatarUrl(character.id, character.avatarUpdatedAt)}
                    hasAvatar={character.hasAvatar}
                    name={character.name}
                    size="lg"
                  />
                  <div className={cn('flex min-w-0 flex-1 items-center gap-1.5')}>
                    <p className={cn('truncate text-base font-medium text-foreground')}>
                      {character.name}
                    </p>
                    {character.isOfficial && <Badge color="blue">{t('official')}</Badge>}
                  </div>
                </div>
                <p className={cn('mt-3 text-sm text-muted-foreground')}>{character.shortBio}</p>
                <CharacterFacts character={character} />
                <div className={cn('mt-4 flex items-center gap-3 border-t border-border pt-3')}>
                  <ExploreAddButton
                    characterId={character.id}
                    isContact={character.isContact}
                    variant="primary"
                    className={cn('min-w-0 flex-1')}
                  />
                  {character.isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={goEdit}
                        className={cn(
                          'inline-flex shrink-0 items-center justify-center rounded-md border border-border px-4 py-2',
                          'text-sm font-medium text-foreground hover:bg-row-hover',
                        )}
                      >
                        {t('edit')}
                      </button>
                      <ExploreDeleteButton
                        characterId={character.id}
                        characterName={character.name}
                      />
                    </>
                  )}
                </div>
              </section>
              <ExploreComments characterId={character.id} />
            </div>
            <ExploreCommentComposer characterId={character.id} />
          </div>
        )}
      </PageStatus>
    </div>
  );
}
