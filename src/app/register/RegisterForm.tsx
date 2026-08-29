'use client';

import { register } from '@/client-api/auth';
import {
  AuthField,
  AuthShell,
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { translateApiError } from '@/i18n/client';
import { localeFromBrowserLanguage } from '@/i18n/config';
import { cn } from '@/lib/client/cn';
import { showErrorToast } from '@/lib/client/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

interface RegisterFormProps {
  turnstileSiteKey: string;
}

export function RegisterForm({ turnstileSiteKey }: RegisterFormProps) {
  const router = useRouter();
  const t = useTranslations('register');
  const tAuth = useTranslations('auth');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [username, setUsername] = useState('');
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
    if (!username.trim() || !nickname.trim() || !password) return;

    if (!turnstileToken) {
      showErrorToast(t('completeVerification'), 'auth-register');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        nickname: nickname.trim(),
        password,
        confirmPassword,
        turnstileToken,
        locale: localeFromBrowserLanguage(navigator.language),
      });
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
        <>
          {t('hasAccount')}{' '}
          <Link href="/login" className={cn('text-primary underline')}>
            {t('goLogin')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4')}>
        <AuthField
          id="username"
          label={tAuth('username')}
          value={username}
          onChange={setUsername}
          autoComplete="username"
        />
        <AuthField
          id="nickname"
          label={t('nickname')}
          value={nickname}
          onChange={setNickname}
          autoComplete="nickname"
        />
        <AuthField
          id="password"
          label={tAuth('password')}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <AuthField
          id="confirmPassword"
          label={t('confirmPassword')}
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        <TurnstileWidget
          ref={turnstileRef}
          siteKey={turnstileSiteKey}
          onTokenChange={handleTurnstileTokenChange}
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
    </AuthShell>
  );
}
