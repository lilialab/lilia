'use client';

import { deleteAccount } from '@/client-api/auth';
import { AuthField } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('deleteAccount');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!currentPassword || !confirmDeletion) return;

    setIsSubmitting(true);
    try {
      await deleteAccount({ currentPassword, confirmDeletion: true });
      await queryClient.cancelQueries({ queryKey: queryKeys.authMe });
      queryClient.removeQueries({ queryKey: queryKeys.authMe });
      router.push('/login', { transitionTypes: ['nav-back'] });
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'delete-account');
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
        <p className={cn('text-sm text-muted-foreground')}>{t('warning')}</p>

        <form onSubmit={handleSubmit} className={cn('mt-4 flex flex-col gap-4')}>
          <AuthField
            id="currentPassword"
            label={t('currentPassword')}
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <label className={cn('flex items-start gap-3 text-sm text-foreground')}>
            <input
              type="checkbox"
              checked={confirmDeletion}
              onChange={(e) => setConfirmDeletion(e.target.checked)}
              className={cn('mt-0.5 h-4 w-4 rounded border-border')}
            />
            <span>{t('confirmLabel')}</span>
          </label>
          <button
            type="submit"
            disabled={isSubmitting || !confirmDeletion}
            className={cn(
              'mt-2 rounded-md bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground',
              'hover:opacity-90 disabled:opacity-40',
            )}
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
