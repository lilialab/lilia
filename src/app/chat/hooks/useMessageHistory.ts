'use client';

import { usePagedMessageHistory } from '@/hooks/usePagedMessageHistory';
import {
  clearSessionMessages,
  fetchHistoryPage,
  type HistoryMessage,
} from '@/lib/client/api/sessions';
import { queryKeys } from '@/lib/client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface UseMessageHistoryOptions {
  activeSessionId: string;
  messages: HistoryMessage[];
  setMessages: (
    messages: HistoryMessage[] | ((prev: HistoryMessage[]) => HistoryMessage[]),
  ) => void;
  bumpScroll: () => void;
}

export function useMessageHistory({
  activeSessionId,
  messages,
  setMessages,
  bumpScroll,
}: UseMessageHistoryOptions) {
  const queryClient = useQueryClient();

  const { hasMore, isLoadingMore, isInitialLoading, loadMore, setHasMore } = usePagedMessageHistory(
    {
      resourceId: activeSessionId,
      queryKey: queryKeys.messageHistory(activeSessionId),
      fetchPage: fetchHistoryPage,
      messages,
      setMessages,
      bumpScroll,
    },
  );

  const { mutateAsync: clearHistoryAsync, isPending: isClearing } = useMutation({
    mutationFn: () => clearSessionMessages(activeSessionId),
    onSuccess: () => {
      setMessages([]);
      setHasMore(false);
      queryClient.setQueryData(queryKeys.messageHistory(activeSessionId), {
        messages: [],
        hasMore: false,
      });
    },
  });

  const clearHistory = useCallback(async () => {
    if (!activeSessionId) return;
    await clearHistoryAsync();
  }, [activeSessionId, clearHistoryAsync]);

  return {
    hasMore,
    isLoadingMore,
    isInitialLoading,
    isClearing,
    loadMore,
    clearHistory,
  };
}
