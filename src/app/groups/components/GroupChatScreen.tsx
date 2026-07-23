'use client';

import { ChatInput } from '@/app/chat/components/ChatInput';
import { MessageList } from '@/app/chat/components/MessageList';
import { useGroupMessageHistory } from '@/app/groups/hooks/useGroupMessageHistory';
import { deleteGroup, fetchGroup, type GroupHistoryMessage } from '@/client-api/groups';
import { ActionSheet } from '@/components/ActionSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { useChat } from '@ai-sdk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { buildUserOutboundMetadata, sendTurnCueIfMentioned } from './GroupChatScreen.utils';

interface GroupChatScreenProps {
  groupSessionId: string;
}

export function GroupChatScreen({ groupSessionId }: GroupChatScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading, isUnauthenticated } = useRequireAuth();
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

      sendTurnCueIfMentioned({
        assistantParts: message.parts,
        members,
        sendMessage,
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
  const deleteDisabled = isBusy;
  const isBootstrapping = isAuthLoading || groupQuery.isLoading || isInitialLoading;
  const isLoadError = groupQuery.isError || isHistoryError;

  if (isUnauthenticated) {
    return null;
  }

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await deleteGroup(groupSessionId);
      queryClient.removeQueries({ queryKey: queryKeys.group(groupSessionId) });
      queryClient.removeQueries({ queryKey: queryKeys.groupMessageHistory(groupSessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      router.replace('/groups', { transitionTypes: ['nav-back'] });
    } catch (err) {
      showErrorToast(formatClientError(err), 'group-delete');
    }
  };

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    setInput('');
    try {
      await sendMessage({
        text,
        metadata: buildUserOutboundMetadata(text),
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
      <ScreenHeader
        title={groupQuery.data?.title ?? '...'}
        onBack={goBackToGroups}
        right={
          <HeaderIconButton aria-label="更多操作" onClick={() => setMenuOpen(true)}>
            <MoreHorizontal className={cn('h-5 w-5')} aria-hidden />
          </HeaderIconButton>
        }
      />

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            key: 'members',
            label: '管理成员',
            disabled: deleteDisabled,
            onSelect: () => {
              router.push(`/groups/${groupSessionId}/members`, {
                transitionTypes: ['nav-forward'],
              });
            },
          },
          {
            key: 'delete',
            label: '删除群聊',
            variant: 'danger',
            disabled: deleteDisabled,
            onSelect: () => {
              queueMicrotask(() => setConfirmDeleteOpen(true));
            },
          },
        ]}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="删除群聊"
        description={`确定删除「${
          groupQuery.data?.title ?? '该群'
        }」吗？群消息将一并删除且无法恢复。`}
        confirmLabel="删除"
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

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
          userDisplayName={user?.displayName ?? '我'}
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
