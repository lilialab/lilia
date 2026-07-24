'use client';

import { PageStatus } from '@/components/PageStatus';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/client/cn';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * 受保护布局门闸：鉴权加载中显示 PageStatus；未登录 return null（跳转由 apiFetch 401 处理）。
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isLoading, isUnauthenticated } = useRequireAuth();

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
