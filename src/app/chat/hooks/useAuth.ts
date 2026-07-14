import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { fetchCurrentUser, logout } from '@/lib/client/api/auth';
import { queryKeys } from '@/lib/client/query-keys';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: queryKeys.authMe,
    queryFn: fetchCurrentUser,
    retry: false,
    meta: { showErrorToast: false },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.authMe });
      await logout();
    },
    onSuccess: () => {
      // 勿 setQueryData(null)：会在 staleTime 内被当成「已拉取的未登录」，换号进 Chat 白屏
      queryClient.removeQueries({ queryKey: queryKeys.authMe });
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
