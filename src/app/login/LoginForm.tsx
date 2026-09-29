'use client';

import { createAnonymousAccount, login } from '@/client-api/auth';
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
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

interface LoginFormProps {
  turnstileSiteKey: string;
}

export function LoginForm({ turnstileSiteKey }: LoginFormProps) {
  const router = useRouter();
  const resetAuthCache = useResetAuthCache();
  const t = useTranslations('login');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAnonymous, setIsCreatingAnonymous] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  /** token 是一次性的：提交后无论成败都要重置，否则下一次提交必然被 Cloudflare 拒。 */
  const resetTurnstile = () => {
    turnstileRef.current?.reset();
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      showErrorToast(t('turnstileRequired'), 'auth-login');
      return;
    }
    if (!account.trim() || !password) return;

    setIsSubmitting(true);
    try {
      await login({ account: account.trim(), password, turnstileToken });
      resetAuthCache();
      router.push('/contacts');
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'auth-login');
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 一键建匿名账号并直接进入；失败只提示，不占用登录表单的提交态。 */
  const handleAnonymous = async () => {
    if (!turnstileToken) {
      showErrorToast(t('turnstileRequired'), 'auth-anonymous');
      return;
    }

    setIsCreatingAnonymous(true);
    try {
      await createAnonymousAccount({
        turnstileToken,
        locale: localeFromBrowserLanguage(navigator.language),
        timeZone: getBrowserTimeZone(),
      });
      resetAuthCache();
      router.push('/contacts');
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'auth-anonymous');
      resetTurnstile();
    } finally {
      setIsCreatingAnonymous(false);
    }
  };

  return (
    <AuthShell title={t('title')} returnTo="/login">
      <TurnstileWidget
        ref={turnstileRef}
        siteKey={turnstileSiteKey}
        action={TURNSTILE_ACTION.LOGIN}
        onTokenChange={handleTurnstileTokenChange}
      />
      <button
        type="button"
        onClick={handleAnonymous}
        disabled={isCreatingAnonymous || isSubmitting || !turnstileToken}
        className={cn(
          'mt-4 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground',
          'transition-colors hover:bg-primary-hover active:bg-primary-hover',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        {isCreatingAnonymous ? t('creatingAnonymous') : t('tryAnonymous')}
      </button>
      <div className={cn('mt-4 text-center')}>
        <button
          type="button"
          aria-expanded={isLoginOpen}
          onClick={() => setIsLoginOpen((open) => !open)}
          className={cn(
            'inline-flex items-center gap-1 text-sm text-muted-foreground',
            'hover:text-foreground active:text-foreground',
          )}
        >
          {isLoginOpen ? t('collapseLogin') : t('loginToggle')}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', isLoginOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
      </div>
      {isLoginOpen && (
        <Form onSubmit={handleSubmit}>
          <Form.Field label={tAuth('account')}>
            <Form.Input
              value={account}
              onChange={setAccount}
              placeholder={tCommon('fieldPlaceholder', { label: tAuth('account') })}
              autoComplete="username"
            />
          </Form.Field>
          <Form.Field label={tAuth('password')}>
            <Form.Input
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={tCommon('fieldPlaceholder', { label: tAuth('password') })}
              autoComplete="current-password"
            />
          </Form.Field>
          <Form.Submit variant="secondary" disabled={isSubmitting} className={cn('mt-4')}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Form.Submit>
          <p className={cn('mt-4 text-center text-sm text-muted-foreground')}>
            {t('noAccount')}{' '}
            <Link href="/register" className={cn('text-primary underline')}>
              {t('goRegister')}
            </Link>
          </p>
        </Form>
      )}
    </AuthShell>
  );
}
