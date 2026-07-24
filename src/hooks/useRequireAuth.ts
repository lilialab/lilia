import { useAuth } from '@/hooks/useAuth';

/**
 * 基于 useAuth，暴露 isUnauthenticated 供 RequireAuth 门闸。
 * 未登录跳转由 apiFetchJson 在任意 401 时统一处理。
 */
export function useRequireAuth() {
  const auth = useAuth();

  return {
    ...auth,
    /** 鉴权已结束且无用户；由 RequireAuth 消费（防闪屏，不负责跳转） */
    isUnauthenticated: !auth.isLoading && auth.user === null,
  };
}
