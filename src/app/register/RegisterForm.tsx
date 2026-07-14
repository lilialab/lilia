'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthField, AuthShell } from '@/components/auth/AuthForm';
import { register } from '@/lib/client/api/auth';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { getBrowserTimeZone } from '@/utils/timezone';

export function RegisterForm() {
  const router = useRouter();
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
        timeZone: getBrowserTimeZone(),
      });
      router.push('/chat');
      router.refresh();
    } catch (err) {
      showErrorToast(formatClientError(err), 'auth-register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="注册账号"
      footer={
        <>
          已有账号？{' '}
          <Link href="/login" className={cn('text-zinc-900 underline')}>
            去登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4')}>
        <AuthField
          id="username"
          label="账号"
          value={username}
          onChange={setUsername}
          autoComplete="username"
        />
        <AuthField
          id="displayName"
          label="昵称"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="nickname"
        />
        <AuthField
          id="password"
          label="密码"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <AuthField
          id="confirmPassword"
          label="确认密码"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white',
            'hover:bg-zinc-800 disabled:opacity-40',
          )}
        >
          {isSubmitting ? '注册中...' : '注册并登录'}
        </button>
      </form>
    </AuthShell>
  );
}
