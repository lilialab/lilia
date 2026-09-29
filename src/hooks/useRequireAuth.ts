import { useAuth } from '@/hooks/useAuth';

/**
 * 基于 useAuth，暴露 isUnauthenticated 供 RequireAuth 门闸。
 * 跳转不由这里负责：任意 401 由 apiFetchJson 清会话并跳 /login，主动登出由 useAuth 自己跳。
 */
export function useRequireAuth() {
  const auth = useAuth();

  return {
    ...auth,
    /** 鉴权已结束且无用户；由 RequireAuth 消费（防闪屏，不负责跳转） */
    isUnauthenticated: !auth.isLoading && auth.user === null,
  };
}
