'use client';

import { fetchContactSession } from '@/lib/client/api/contacts';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useCharacterSession(characterId: string) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.characterSession(characterId),
    queryFn: () => fetchContactSession(characterId),
    enabled: Boolean(characterId),
    retry: false,
    // 失败由 ChatScreen 展示错误态，避免全局 QueryCache toast
    meta: { showErrorToast: false },
  });

  return {
    sessionId: data?.sessionId ?? '',
    displayName: data?.displayName ?? '',
    isLoading,
    isError,
    error,
  };
}
