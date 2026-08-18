'use client';

import { register } from '@/client-api/auth';
import { AuthField, AuthShell } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations('register');
  const tAuth = useTranslations('auth');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || !password) return;

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        displayName: displayName.trim(),
        password,
        confirmPassword,
      });
      router.push('/contacts');
      router.refresh();
    } catch (err) {
      showErrorToast(formatClientError(err), 'auth-register');
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
          id="displayName"
          label={t('displayName')}
          value={displayName}
          onChange={setDisplayName}
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
