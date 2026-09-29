'use client';

import { upgradeAccount } from '@/client-api/auth';
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

export function SaveAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useRequiredUser();
  const t = useTranslations('account');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');

  const [account, setAccount] = useState(user.account);
  const [nickname, setNickname] = useState(user.nickname);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!account.trim() || !nickname.trim() || !password || !confirmPassword) return;

    setIsSubmitting(true);
    try {
      await queryClient.cancelQueries({ queryKey: queryKeys.authMe });
      await upgradeAccount({
        account: account.trim(),
        nickname: nickname.trim(),
        password,
        confirmPassword,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.authMe });
      showSuccessToast(t('saveSuccess'), 'save-account');
      router.push('/me/settings', { transitionTypes: ['nav-back'] });
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'save-account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
      <ScreenHeader
        title={t('saveAccount')}
        onBack={() => router.push('/me/settings', { transitionTypes: ['nav-back'] })}
      />

      <div className={cn('flex-1 overflow-y-auto py-3')}>
        {user.hasPassword
          ? <p className={cn('px-4 py-6 text-sm text-muted-foreground')}>{t('alreadySaved')}</p>
          : (
            <>
              <p className={cn('px-4 pb-3 text-xs text-muted-foreground')}>
                {t('anonymousBannerHint')}
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Section>
                  <Form.Field label={tAuth('account')}>
                    <Form.Input
                      value={account}
                      onChange={setAccount}
                      placeholder={tCommon('fieldPlaceholder', { label: tAuth('account') })}
                      autoComplete="username"
                    />
                  </Form.Field>
                  <Form.Field label={t('nickname')}>
                    <Form.Input
                      value={nickname}
                      onChange={setNickname}
                      placeholder={tCommon('fieldPlaceholder', { label: t('nickname') })}
                      autoComplete="nickname"
                    />
                  </Form.Field>
                  <Form.Field label={tAuth('password')}>
                    <Form.Input
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder={tCommon('fieldPlaceholder', { label: tAuth('password') })}
                      autoComplete="new-password"
                    />
                  </Form.Field>
                  <Form.Field label={t('confirmPassword')}>
                    <Form.Input
                      type="password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder={tCommon('fieldPlaceholder', { label: t('confirmPassword') })}
                      autoComplete="new-password"
                    />
                  </Form.Field>
                  <Form.Submit disabled={isSubmitting} className={cn('mt-4')}>
                    {isSubmitting ? t('saving') : t('saveSubmit')}
                  </Form.Submit>
                </Form.Section>
              </Form>
            </>
          )}
      </div>
    </div>
  );
}
