import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 基于 useAuth：未登录时跳转 /login，并暴露 isUnauthenticated 供页面提前 return null。
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
    /** 鉴权已结束且未登录，页面应 return null */
    isUnauthenticated: !auth.isLoading && auth.user === null,
  };
}
