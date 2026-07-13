'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthField, AuthShell } from '@/components/auth/AuthForm';
import { login } from '@/lib/client/api/auth';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      router.push('/chat');
      router.refresh();
    } catch (err) {
      showErrorToast(formatClientError(err), 'auth-login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="登录 pai-arbor"
      footer={
        <>
          还没有账号？{' '}
          <Link href="/register" className={cn('text-zinc-900 underline')}>
            去注册
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
          id="password"
          label="密码"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white',
            'hover:bg-zinc-800 disabled:opacity-40',
          )}
        >
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>
    </AuthShell>
  );
}
