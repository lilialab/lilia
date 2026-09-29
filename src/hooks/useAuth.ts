import { fetchCurrentUser, logout } from '@/client-api/auth';
import { queryKeys } from '@/lib/client/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: queryKeys.authMe,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
    meta: { showErrorToast: false },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // 掐掉在途的 authMe 请求，免得它在登出之后才返回并把 user 写回缓存
      await queryClient.cancelQueries({ queryKey: queryKeys.authMe });
      await logout();
      // 刻意不清 authMe 缓存：清掉后受保护树若再渲染一次就会读到已消失的 user。
      // 缓存留给下一次 fetch 覆盖（并在登录 / 建号成功时由 useResetAuthCache 丢弃）。
      router.push('/login');
      router.refresh();
    },
  });

  const logoutHandler = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isError: meQuery.isError,
    logout: logoutHandler,
    isLoggingOut: logoutMutation.isPending,
  };
}
