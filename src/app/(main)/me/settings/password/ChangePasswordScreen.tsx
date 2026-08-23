'use client';

import { changePassword } from '@/client-api/auth';
import { AuthField } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChangePasswordScreen() {
  const router = useRouter();
  const t = useTranslations('changePassword');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) return;

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      showSuccessToast(t('success'), 'change-password');
      router.push('/login', { transitionTypes: ['nav-back'] });
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'change-password');
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
            id="currentPassword"
            label={t('currentPassword')}
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <AuthField
            id="newPassword"
            label={t('newPassword')}
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <AuthField
            id="confirmNewPassword"
            label={t('confirmNewPassword')}
            type="password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            autoComplete="new-password"
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
