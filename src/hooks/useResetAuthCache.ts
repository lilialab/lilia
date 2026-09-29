import { queryKeys } from '@/lib/client/query-keys';
import { useQueryClient } from '@tanstack/react-query';

/**
 * 登录 / 注册 / 匿名建号成功后，把 authMe 缓存整条丢弃。
 *
 * 用 remove 而不是 invalidate：invalidate 保留旧数据，受保护页挂载时仍会先渲染一帧上一个账号；
 * remove 把 query 从缓存删掉，下一次 `useAuth` 必然重新拉取。调用点都在未门闸的页面（/login 等），
 * 此时没有受保护组件在观察它，删掉是安全的（登出时删则会让门闸下的子树失去 user）。
 */
export function useResetAuthCache(): () => void {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: queryKeys.authMe });
  };
}
