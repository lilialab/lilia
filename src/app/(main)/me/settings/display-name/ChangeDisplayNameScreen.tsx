'use client';

import { updateUserDisplayName } from '@/client-api/auth';
import { AuthField } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChangeDisplayNameScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useTranslations('changeDisplayName');
  const [draftDisplayName, setDraftDisplayName] = useState<string | null>(null);
  const displayName = draftDisplayName ?? user?.displayName ?? '';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateUserDisplayName(displayName.trim());
      await queryClient.invalidateQueries({ queryKey: queryKeys.authMe });
      showSuccessToast(t('success'), 'change-display-name');
      router.push('/me/settings', { transitionTypes: ['nav-back'] });
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'change-display-name');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('title')}
        onBack={() => router.push('/me/settings', { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto px-4 py-4')}>
        <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4')}>
          <AuthField
            id="displayName"
            label={t('displayName')}
            value={displayName}
            onChange={setDraftDisplayName}
            autoComplete="nickname"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground',
              'hover:bg-primary-hover disabled:opacity-40',
            )}
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
