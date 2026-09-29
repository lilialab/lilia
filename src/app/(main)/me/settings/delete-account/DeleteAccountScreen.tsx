'use client';

import { deleteAccount } from '@/client-api/auth';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { showErrorToast } from '@/lib/client/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteAccountScreen() {
  const router = useRouter();
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
      // 刻意不清 authMe 缓存：清掉后受保护树若再渲染一次就会读到已消失的 user。
      // 缓存留给下一次 fetch 覆盖（已删除的账号一定 401 → 清 Cookie → 回登录）。
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
