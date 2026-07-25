'use client';

import { fetchContactSession } from '@/client-api/contacts';
import { useRefetchOnVisible } from '@/hooks/useRefetchOnVisible';
import { queryKeys } from '@/lib/client/query-keys';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

const GENERATING_POLL_MS = 1500;

export function useCharacterSession(characterId: string) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.characterSession(characterId),
    queryFn: () => fetchContactSession(characterId),
    enabled: Boolean(characterId),
    retry: false,
    // 失败由 ChatScreen 展示错误态，避免全局 QueryCache toast
    meta: { showErrorToast: false },
    refetchInterval: (query) => (query.state.data?.isGenerating ? GENERATING_POLL_MS : false),
  });

  const refetchSession = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRefetchOnVisible(refetchSession);

  return {
    sessionId: data?.sessionId ?? '',
    displayName: data?.displayName ?? '',
    isGenerating: data?.isGenerating ?? false,
    isLoading,
    isError,
    error,
  };
}
