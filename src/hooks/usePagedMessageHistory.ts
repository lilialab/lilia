'use client';

import { type QueryKey, useMutation, useQuery } from '@tanstack/react-query';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface MessageHistoryPage<T> {
  messages: T[];
  hasMore: boolean;
}

/** 与 useChat().setMessages 同形。 */
export type SetMessages<T extends UIMessage> = UseChatHelpers<T>['setMessages'];

interface UsePagedMessageHistoryOptions<T extends UIMessage> {
  /** 资源 id（sessionId / groupSessionId）；空则不请求 */
  resourceId: string;
  queryKey: QueryKey;
  fetchPage: (resourceId: string, before?: string) => Promise<MessageHistoryPage<T>>;
  messages: T[];
  setMessages: SetMessages<T>;
  bumpScroll: () => void;
}

/** 通用消息历史：初始页同步 + before 游标上翻。 */
export function usePagedMessageHistory<T extends UIMessage>({
  resourceId,
  queryKey,
  fetchPage,
  messages,
  setMessages,
  bumpScroll,
}: UsePagedMessageHistoryOptions<T>) {
  const [hasMore, setHasMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const syncedDataUpdatedAtRef = useRef<number | null>(null);

  const {
    data,
    dataUpdatedAt,
    isFetching,
    isLoading: isInitialLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => fetchPage(resourceId),
    enabled: Boolean(resourceId),
  });

  useEffect(() => {
    syncedDataUpdatedAtRef.current = null;
  }, [resourceId]);

  useEffect(() => {
    if (!data || !resourceId || isFetching) return;
    if (syncedDataUpdatedAtRef.current === dataUpdatedAt) return;

    syncedDataUpdatedAtRef.current = dataUpdatedAt;
    setMessages(data.messages);
    setHasMore(data.hasMore);
    bumpScroll();
  }, [data, dataUpdatedAt, resourceId, isFetching, setMessages, bumpScroll]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (before: string) => fetchPage(resourceId, before),
    onSuccess: (page) => {
      if (page.messages.length === 0) {
        setHasMore(false);
        return;
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const older = page.messages.filter((m) => !existingIds.has(m.id));
        return [...older, ...prev];
      });
      setHasMore(page.hasMore);
    },
    onSettled: () => {
      loadingMoreRef.current = false;
    },
  });

  const loadMore = useCallback(async () => {
    if (!resourceId || !hasMore || loadingMoreRef.current) return;

    const oldestId = messages[0]?.id;
    if (!oldestId) return;

    loadingMoreRef.current = true;
    await mutateAsync(oldestId);
  }, [resourceId, hasMore, messages, mutateAsync]);

  return {
    hasMore,
    isLoadingMore: isPending,
    isInitialLoading,
    isError,
    loadMore,
    setHasMore,
  };
}
