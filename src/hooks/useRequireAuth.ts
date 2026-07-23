import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 基于 useAuth：未登录时跳转 /login，并暴露 isUnauthenticated。
 * 页面侧请用 RequireAuth 布局门闸，勿在各 Screen 重复处理。
 */
export function useRequireAuth() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.user === null) {
      router.replace('/login');
    }
  }, [auth.isLoading, auth.user, router]);

  return {
    ...auth,
    /** 鉴权已结束且未登录；由 RequireAuth 消费 */
    isUnauthenticated: !auth.isLoading && auth.user === null,
  };
}
