'use client';

import { useCallback, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ChatInput } from '@/app/chat/components/ChatInput';
import { MessageList } from '@/app/chat/components/MessageList';
import { useGroupMessageHistory } from '@/app/groups/hooks/useGroupMessageHistory';
import { fetchGroup, type GroupHistoryMessage } from '@/lib/client/api/groups';
import { queryKeys } from '@/lib/client/query-keys';
import { cn } from '@/lib/client/cn';
import { extractTextFromParts } from '@/lib/message-parts';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MESSAGE_KIND_TURN_CUE } from '@/types/message-kind';
import { buildTurnCueText, extractFirstMentionSlug } from './GroupChatScreen.utils';

interface GroupChatScreenProps {
  groupSessionId: string;
}

export function GroupChatScreen({ groupSessionId }: GroupChatScreenProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isUnauthenticated } = useRequireAuth();
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);

  const bumpScroll = useCallback(() => {
    setScrollToBottomKey((k) => k + 1);
  }, []);

  const goBackToGroups = useCallback(() => {
    router.push('/groups', { transitionTypes: ['nav-back'] });
  }, [router]);

  const groupQuery = useQuery({
    queryKey: queryKeys.group(groupSessionId),
    queryFn: () => fetchGroup(groupSessionId),
    enabled: Boolean(user) && Boolean(groupSessionId),
  });

  const members = groupQuery.data?.members ?? [];

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<GroupHistoryMessage>({
        api: `/api/groups/${groupSessionId}/chat`,
        credentials: 'include',
      }),
    [groupSessionId],
  );

  const { messages, status, sendMessage, setMessages } = useChat<GroupHistoryMessage>({
    id: `group-${groupSessionId}`,
    experimental_throttle: 50,
    transport: chatTransport,
    onFinish: ({ message, isAbort, isDisconnect, isError }) => {
      if (isAbort || isDisconnect || isError || message.role !== 'assistant') return;

      const slug = extractFirstMentionSlug(extractTextFromParts(message.parts));
      if (!slug || !members.some((m) => m.slug === slug)) return;

      void sendMessage({
        text: buildTurnCueText(slug),
        metadata: { kind: MESSAGE_KIND_TURN_CUE, slug },
      });
    },
  });

  const {
    hasMore,
    isLoadingMore,
    isInitialLoading,
    isError: isHistoryError,
    loadMore,
  } = useGroupMessageHistory({
    groupSessionId,
    messages,
    setMessages,
    bumpScroll,
  });

  const isBusy = status === 'submitted' || status === 'streaming';
  const isBootstrapping = isAuthLoading || groupQuery.isLoading || isInitialLoading;
  const isLoadError = groupQuery.isError || isHistoryError;

  if (isUnauthenticated) {
    return null;
  }

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    setInput('');
    try {
      await sendMessage({
        text,
        metadata: {
          kind: null,
          slug: extractFirstMentionSlug(text),
        },
      });
    } catch (err) {
      showErrorToast(formatClientError(err), 'group-send');
      setInput(text);
    }
  };

  const handleLoadMore = async () => {
    try {
      await loadMore();
    } catch (err) {
      showErrorToast(formatClientError(err), 'group-history-more');
    }
  };

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader title={groupQuery.data?.title || '...'} onBack={goBackToGroups} />

      <PageStatus
        loading={isBootstrapping}
        error={isLoadError}
        errorMessage="无法加载群聊"
        actionLabel="返回群列表"
        onAction={goBackToGroups}
      >
        <MessageList
          messages={messages}
          status={status}
          scrollToBottomKey={scrollToBottomKey}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void handleLoadMore()}
          userDisplayName={user?.displayName || '我'}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleFormSubmit}
          disabled={isBusy}
          isStreaming={isBusy}
        />
      </PageStatus>
    </div>
  );
}
