'use client';

import { changePassword } from '@/client-api/auth';
import { Form } from '@/components/Form';
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
  const tCommon = useTranslations('common');
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

      <div className={cn('flex-1 overflow-y-auto py-3')}>
        <Form onSubmit={handleSubmit}>
          <Form.Section>
            <Form.Field label={t('currentPassword')}>
              <Form.Input
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder={tCommon('fieldPlaceholder', { label: t('currentPassword') })}
                autoComplete="current-password"
              />
            </Form.Field>
            <Form.Field label={t('newPassword')}>
              <Form.Input
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder={tCommon('fieldPlaceholder', { label: t('newPassword') })}
                autoComplete="new-password"
              />
            </Form.Field>
            <Form.Field label={t('confirmNewPassword')}>
              <Form.Input
                type="password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder={tCommon('fieldPlaceholder', { label: t('confirmNewPassword') })}
                autoComplete="new-password"
              />
            </Form.Field>
            <Form.Submit disabled={isSubmitting} className={cn('mt-4')}>
              {isSubmitting ? t('submitting') : t('submit')}
            </Form.Submit>
          </Form.Section>
        </Form>
      </div>
    </div>
  );
}
