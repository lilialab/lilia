'use client';

import { fetchGroupHistoryPage, type GroupHistoryMessage } from '@/client-api/groups';
import { type SetMessages, usePagedMessageHistory } from '@/hooks/usePagedMessageHistory';
import { queryKeys } from '@/lib/client/query-keys';

interface UseGroupMessageHistoryOptions {
  groupSessionId: string;
  messages: GroupHistoryMessage[];
  setMessages: SetMessages<GroupHistoryMessage>;
  bumpScroll: () => void;
}

/** 群聊历史分页：初始加载 + before 游标上翻。 */
export function useGroupMessageHistory({
  groupSessionId,
  messages,
  setMessages,
  bumpScroll,
}: UseGroupMessageHistoryOptions) {
  const { hasMore, isLoadingMore, isInitialLoading, isError, loadMore } = usePagedMessageHistory({
    resourceId: groupSessionId,
    queryKey: queryKeys.groupMessageHistory(groupSessionId),
    fetchPage: fetchGroupHistoryPage,
    messages,
    setMessages,
    bumpScroll,
  });

  return {
    hasMore,
    isLoadingMore,
    isInitialLoading,
    isError,
    loadMore,
  };
}
