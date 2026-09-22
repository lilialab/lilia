'use client';

import { deleteAccount } from '@/client-api/auth';
import { Form } from '@/components/Form';
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
  const tCommon = useTranslations('common');
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

      <div className={cn('flex-1 overflow-y-auto py-3')}>
        <p className={cn('px-4 text-sm text-muted-foreground')}>{t('warning')}</p>

        <Form onSubmit={handleSubmit} className={cn('mt-4')}>
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
            <Form.Checkbox checked={confirmDeletion} onChange={setConfirmDeletion}>
              {t('confirmLabel')}
            </Form.Checkbox>
            <Form.Submit
              variant="danger"
              disabled={isSubmitting || !confirmDeletion}
              className={cn('mt-4')}
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </Form.Submit>
          </Form.Section>
        </Form>
      </div>
    </div>
  );
}
