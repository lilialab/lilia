import type { AuthUser } from '@/client-api/auth';
import { useAuth } from '@/hooks/useAuth';

/**
 * 门闸之下的当前用户，必然非空。
 *
 * 只在 `RequireAuth` 浇出的子树里使用：加载中门闸显示 PageStatus，无用户时门闸不渲染子树，
 * 所以这里拿到的一定是已就绪的真实用户（不需要构造占位对象）。
 */
export function useRequiredUser(): AuthUser {
  const { user } = useAuth();

  if (!user) {
    throw new Error('useRequiredUser 只能在 RequireAuth 之下使用');
  }

  return user;
}
