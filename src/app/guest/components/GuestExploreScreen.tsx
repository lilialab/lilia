'use client';

import { characterAvatarUrl } from '@/client-api/characters';
import { fetchGuestCharacters, type GuestCatalogCharacter } from '@/client-api/guest';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GuestCharacterListProps {
  characters: GuestCatalogCharacter[];
}

function GuestCharacterList({ characters }: GuestCharacterListProps) {
  const t = useTranslations('trial');
  return (
    <ul>
      {characters.map((character) => (
        <li key={character.id} className={cn('border-t border-border/50')}>
          <Link
            href={`/guest/chat/${character.id}`}
            transitionTypes={['nav-forward']}
            className={cn(
              'flex items-center gap-3 px-4 py-3 hover:bg-row-hover active:bg-row-hover',
            )}
          >
            <Avatar
              src={characterAvatarUrl(character.id, character.avatarUpdatedAt)}
              hasAvatar={character.hasAvatar}
              name={character.name}
            />
            <div className={cn('min-w-0 flex-1')}>
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
            <span className={cn('shrink-0 text-sm text-primary')}>{t('tryChat')}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function GuestExploreScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const t = useTranslations('trial');

  const charactersQuery = useQuery({
    queryKey: queryKeys.guestCharacters,
    queryFn: fetchGuestCharacters,
  });

  const characters = charactersQuery.data ?? [];

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('exploreTitle')}
        onBack={() => router.push('/login', { transitionTypes: ['nav-back'] })}
      />

      <PageStatus
        loading={charactersQuery.isLoading}
        error={charactersQuery.isError}
        errorMessage={t('loadError')}
      >
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto')}>
          <p className={cn('px-4 py-3 text-sm text-muted-foreground')}>{t('exploreHint')}</p>
          {characters.length === 0
            ? (
              <p className={cn('px-4 py-8 text-center text-sm text-muted-foreground')}>
                {t('empty')}
              </p>
            )
            : (
              <div className={cn('bg-background')}>
                <GuestCharacterList characters={characters} />
              </div>
            )}
          <p className={cn('px-4 py-6 text-center text-sm text-muted-foreground')}>
            {t('hasAccount')}{' '}
            <Link href="/login" className={cn('text-primary underline')}>
              {t('goLogin')}
            </Link>
            {' · '}
            <Link href="/register" className={cn('text-primary underline')}>
              {t('goRegister')}
            </Link>
          </p>
        </div>
      </PageStatus>
    </div>
  );
}
