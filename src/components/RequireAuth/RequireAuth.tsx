'use client';

import { useI18n } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/client/cn';
import { useEffect } from 'react';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * 受保护布局门闸：鉴权加载中显示 PageStatus；未登录 return null（跳转由 apiFetch 401 处理）。
 * 有 user 时用 DB locale 覆盖本机 Cookie / UI。
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading, isUnauthenticated } = useRequireAuth();
  const { setLocale } = useI18n();

  useEffect(() => {
    if (!user) return;
    setLocale(user.locale);
  }, [user, setLocale]);

  if (isUnauthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-full flex-col')}>
        <PageStatus loading />
      </div>
    );
  }

  return children;
}
