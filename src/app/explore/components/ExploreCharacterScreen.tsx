'use client';

import { ExploreAddButton } from '@/app/explore/components/ExploreAddButton';
import { ExploreCommentComposer, ExploreComments } from '@/app/explore/components/ExploreComments';
import { characterAvatarUrl, fetchCharacter } from '@/client-api/characters';
import { Avatar } from '@/components/Avatar';
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
                <div className={cn('flex items-start gap-4')}>
                  <Avatar
                    src={characterAvatarUrl(character.id, character.avatarUpdatedAt)}
                    hasAvatar={character.hasAvatar}
                    name={character.name}
                    size="lg"
                  />
                  <div className={cn('min-w-0 flex-1')}>
                    <p className={cn('text-sm text-muted-foreground')}>{character.shortBio}</p>
                    <div className={cn('mt-4')}>
                      <ExploreAddButton
                        characterId={character.id}
                        isContact={character.isContact}
                      />
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
