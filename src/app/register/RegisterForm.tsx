'use client';

import { privacyPageHref } from '@/app/privacy/privacy-return';
import { register } from '@/client-api/auth';
import { AuthShell, TurnstileWidget, type TurnstileWidgetHandle } from '@/components/auth';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { useResetAuthCache } from '@/hooks/useResetAuthCache';
import { translateApiError } from '@/i18n/client';
import { localeFromBrowserLanguage } from '@/i18n/config';
import { cn } from '@/lib/client/cn';
import { showErrorToast } from '@/lib/client/toast';
import { TURNSTILE_ACTION } from '@/lib/turnstile';
import { getBrowserTimeZone } from '@/utils/timezone';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

interface RegisterFormProps {
  turnstileSiteKey: string;
}

export function RegisterForm({ turnstileSiteKey }: RegisterFormProps) {
  const router = useRouter();
  const resetAuthCache = useResetAuthCache();
  const t = useTranslations('register');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [account, setAccount] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!account.trim() || !nickname.trim() || !password) return;

    if (!turnstileToken) {
      showErrorToast(t('completeVerification'), 'auth-register');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        account: account.trim(),
        nickname: nickname.trim(),
        password,
        confirmPassword,
        turnstileToken,
        locale: localeFromBrowserLanguage(navigator.language),
        timeZone: getBrowserTimeZone(),
      });
      resetAuthCache();
      router.push('/contacts');
      router.refresh();
    } catch (err) {
      turnstileRef.current?.reset();
      showErrorToast(translateApiError(err), 'auth-register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('title')}
      returnTo="/register"
      footer={
        <div className={cn('flex flex-col gap-3')}>
          <p>
            {t('hasAccount')}{' '}
            <Link href="/login" className={cn('text-primary underline')}>
              {t('goLogin')}
            </Link>
          </p>
          <p>
            <Link
              href={privacyPageHref('/register')}
              transitionTypes={['nav-forward']}
              className={cn('text-primary underline')}
            >
              {t('privacyPolicy')}
            </Link>
          </p>
        </div>
      }
    >
      <Form onSubmit={handleSubmit}>
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
        <div className={cn('mt-4')}>
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            action={TURNSTILE_ACTION.REGISTER}
            onTokenChange={handleTurnstileTokenChange}
          />
        </div>
        <Form.Submit disabled={isSubmitting} className={cn('mt-4')}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Form.Submit>
      </Form>
    </AuthShell>
  );
}
