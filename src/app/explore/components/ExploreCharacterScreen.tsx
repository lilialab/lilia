'use client';

import { ExploreAddButton } from '@/app/explore/components/ExploreAddButton';
import { ExploreBadge } from '@/app/explore/components/ExploreBadge';
import { ExploreCommentComposer, ExploreComments } from '@/app/explore/components/ExploreComments';
import { ExploreListedButton } from '@/app/explore/components/ExploreListedButton';
import { characterAvatarUrl, fetchCharacter } from '@/client-api/characters';
import { Avatar } from '@/components/Avatar';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
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
      <ScreenHeader
        title={character?.name ?? t('title')}
        onBack={goBack}
        right={character?.isOwner && (
          <HeaderIconButton aria-label={t('edit')} onClick={goEdit}>
            <Pencil className={cn('h-5 w-5')} aria-hidden />
          </HeaderIconButton>
        )}
      />

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
                <div className={cn('flex items-start gap-4')}>
                  <Avatar
                    src={characterAvatarUrl(character.id, character.avatarUpdatedAt)}
                    hasAvatar={character.hasAvatar}
                    name={character.name}
                    size="lg"
                  />
                  <div className={cn('min-w-0 flex-1')}>
                    {(character.isOfficial || !character.isListed) && (
                      <div className={cn('mb-2 flex flex-wrap gap-1.5')}>
                        {character.isOfficial && <ExploreBadge>{t('official')}</ExploreBadge>}
                        {!character.isListed && <ExploreBadge>{t('unlisted')}</ExploreBadge>}
                      </div>
                    )}
                    <p className={cn('text-sm text-muted-foreground')}>{character.shortBio}</p>
                    <div className={cn('mt-4 flex flex-wrap gap-2')}>
                      {character.isListed && (
                        <ExploreAddButton
                          characterId={character.id}
                          isContact={character.isContact}
                        />
                      )}
                      {character.isOwner && (
                        <ExploreListedButton
                          characterId={character.id}
                          isListed={character.isListed}
                        />
                      )}
                    </div>
                  </div>
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
