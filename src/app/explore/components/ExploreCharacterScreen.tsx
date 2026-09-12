'use client';

import { ExploreAddButton } from '@/app/explore/components/ExploreAddButton';
import { fetchCharacter } from '@/client-api/characters';
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
          <div className={cn('flex-1 overflow-y-auto')}>
            <section className={cn('mt-3 bg-background px-4 py-4')}>
              <p className={cn('text-sm text-muted-foreground')}>{character.shortBio}</p>
              <div className={cn('mt-4')}>
                <ExploreAddButton
                  characterId={character.id}
                  isContact={character.isContact}
                />
              </div>
            </section>
          </div>
        )}
      </PageStatus>
    </div>
  );
}
