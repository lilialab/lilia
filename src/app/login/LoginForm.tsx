'use client';

import { login } from '@/client-api/auth';
import { AuthShell } from '@/components/auth';
import { Form } from '@/components/Form';
import { useTranslations } from '@/components/I18nProvider';
import { translateApiError } from '@/i18n/client';
import { cn } from '@/lib/client/cn';
import { showErrorToast } from '@/lib/client/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('login');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
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
          <p>
            <Link href="/guest" className={cn('text-primary underline')}>
              {t('tryWithoutAccount')}
            </Link>
          </p>
          <p className={cn('mt-3')}>
            {t('noAccount')}{' '}
            <Link href="/register" className={cn('text-primary underline')}>
              {t('goRegister')}
            </Link>
          </p>
        </>
      }
    >
      <Form onSubmit={handleSubmit}>
        <Form.Field label={tAuth('username')}>
          <Form.Input
            value={username}
            onChange={setUsername}
            placeholder={tCommon('fieldPlaceholder', { label: tAuth('username') })}
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
        <Form.Submit disabled={isSubmitting} className={cn('mt-4')}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Form.Submit>
      </Form>
    </AuthShell>
  );
}
