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
