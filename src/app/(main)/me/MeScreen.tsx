'use client';

import { uploadUserAvatar, userAvatarUrl } from '@/client-api/auth';
import { AvatarPicker } from '@/components/Avatar';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { MeMenuLink } from './MeMenuLink';

export function MeScreen() {
  const { user, logout, isLoggingOut } = useAuth();
  const t = useTranslations('me');
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  async function handleAvatarFile(file: File) {
    setUploading(true);
    try {
      await uploadUserAvatar(file);
      await queryClient.invalidateQueries({ queryKey: queryKeys.authMe });
    } catch (err) {
      showErrorToast(translateApiError(err), 'upload-avatar');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader title={t('title')} />

      <div className={cn('flex-1 overflow-y-auto')}>
        <section className={cn('mt-3 flex items-center gap-4 bg-background px-4 py-4')}>
          <AvatarPicker
            src={user ? userAvatarUrl(user.id, user.updatedAt) : ''}
            hasAvatar={user?.hasAvatar ?? false}
            name={user?.nickname ?? ''}
            ariaLabel={t('changeAvatar')}
            disabled={uploading}
            onFile={handleAvatarFile}
            onFileTooLarge={() => {
              showErrorToast(translateApiError({ code: 'AVATAR_TOO_LARGE' }), 'upload-avatar');
            }}
          />
          <div className={cn('min-w-0')}>
            <p className={cn('text-base font-medium text-foreground')}>
              {user?.nickname ?? '...'}
            </p>
            {user?.username && (
              <p className={cn('mt-1 text-sm text-muted-foreground')}>@{user.username}</p>
            )}
          </div>
        </section>

        <section className={cn('mt-3 bg-background')}>
          <MeMenuLink href="/me/settings" label={t('settings')} icon={Settings} />
        </section>

        <section className={cn('mt-3 bg-background')}>
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className={cn(
              'flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm text-destructive',
              'hover:bg-row-hover disabled:opacity-40',
            )}
          >
            <LogOut className={cn('h-4 w-4')} aria-hidden />
            {isLoggingOut ? t('loggingOut') : t('logout')}
          </button>
        </section>
      </div>
    </div>
  );
}
