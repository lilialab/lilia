'use client';

import { updateUserNickname } from '@/client-api/auth';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRequiredUser } from '@/hooks/useRequiredUser';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast, showSuccessToast } from '@/lib/client/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChangeNicknameScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useRequiredUser();
  const t = useTranslations('changeNickname');
  const tCommon = useTranslations('common');
  const [draftNickname, setDraftNickname] = useState<string | null>(null);
  const nickname = draftNickname ?? user.nickname;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsSubmitting(true);
    try {
      await queryClient.cancelQueries({ queryKey: queryKeys.authMe });
      await updateUserNickname(nickname.trim());
      await queryClient.invalidateQueries({ queryKey: queryKeys.authMe });
      showSuccessToast(t('success'), 'change-nickname');
      router.push('/me/settings', { transitionTypes: ['nav-back'] });
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'change-nickname');
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
            <Form.Field label={t('nickname')}>
              <Form.Input
                value={nickname}
                onChange={setDraftNickname}
                placeholder={tCommon('fieldPlaceholder', { label: t('nickname') })}
                autoComplete="nickname"
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
