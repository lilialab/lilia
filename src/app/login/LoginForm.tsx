'use client';

import { login } from '@/client-api/auth';
import { AuthField, AuthShell } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { translateApiError } from '@/i18n/translate-api-error';
import { cn } from '@/lib/client/cn';
import { showErrorToast } from '@/lib/client/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('login');
  const tAuth = useTranslations('auth');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      router.push('/contacts');
      router.refresh();
    } catch (err) {
      showErrorToast(translateApiError(err), 'auth-login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={t('title')}
      returnTo="/login"
      footer={
        <>
          {t('noAccount')}{' '}
          <Link href="/register" className={cn('text-primary underline')}>
            {t('goRegister')}
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
          id="password"
          label={tAuth('password')}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
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
