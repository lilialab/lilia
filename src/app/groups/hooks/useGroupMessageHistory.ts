'use client';

import {
  fetchGroupHistoryPage,
  type GroupHistoryMessage,
} from '@/lib/client/api/groups';
import { queryKeys } from '@/lib/client/query-keys';
import { usePagedMessageHistory } from '@/hooks/usePagedMessageHistory';

interface UseGroupMessageHistoryOptions {
  groupSessionId: string;
  messages: GroupHistoryMessage[];
  setMessages: (
    messages:
      | GroupHistoryMessage[]
      | ((prev: GroupHistoryMessage[]) => GroupHistoryMessage[]),
  ) => void;
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
