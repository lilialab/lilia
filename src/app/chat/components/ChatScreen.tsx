'use client';

import { removeContact } from '@/client-api/contacts';
import type { HistoryMessage } from '@/client-api/sessions';
import { ActionSheet } from '@/components/ActionSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { SyncPendingReplyBanner } from '@/components/SyncPendingReplyBanner';
import { useAuth } from '@/hooks/useAuth';
import { useOnServerGenerationIdle } from '@/hooks/useOnServerGenerationIdle';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useCharacterSession } from '../hooks/useCharacterSession';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

interface ChatScreenProps {
  characterId: string;
}

export function ChatScreen({ characterId }: ChatScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const {
    sessionId,
    displayName,
    isGenerating,
    isLoading,
    isError,
  } = useCharacterSession(characterId);

  const bumpScroll = useCallback(() => {
    setScrollToBottomKey((k) => k + 1);
  }, []);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<HistoryMessage>({
        api: '/api/chat',
        credentials: 'include',
      }),
    [],
  );

  const { messages, status, sendMessage, setMessages } = useChat<HistoryMessage>({
    id: sessionId ?? `character-${characterId}`,
    experimental_throttle: 50,
    transport: chatTransport,
  });

  const { hasMore, isLoadingMore, isInitialLoading, loadMore, clearHistory } = useMessageHistory({
    activeSessionId: sessionId,
    messages,
    setMessages,
    bumpScroll,
  });

  const isStreaming = status === 'submitted' || status === 'streaming';
  const inputLocked = isStreaming || isGenerating;

  const reloadHistory = useCallback(() => {
    if (!sessionId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.messageHistory(sessionId) });
  }, [queryClient, sessionId]);

  useOnServerGenerationIdle({
    isGenerating,
    isStreaming,
    onIdle: reloadHistory,
  });

  const clearDisabled = inputLocked || messages.length === 0 || isInitialLoading;
  const deleteDisabled = inputLocked;
  const handleConfirmClear = async () => {
    setConfirmClearOpen(false);
    try {
      await clearHistory();
    } catch (err) {
      showErrorToast(formatClientError(err), 'chat-clear');
    }
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await removeContact(characterId);
      queryClient.removeQueries({ queryKey: queryKeys.characterSession(characterId) });
      queryClient.removeQueries({ queryKey: queryKeys.messageHistory(sessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      router.push('/contacts', { transitionTypes: ['nav-back'] });
    } catch (err) {
      showErrorToast(formatClientError(err), 'chat-delete-contact');
    }
  };

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!input.trim() || inputLocked || !sessionId) return;

    const currentInput = input;
    setInput('');

    try {
      await sendMessage({ text: currentInput }, { body: { sessionId } });
    } catch (err) {
      showErrorToast(formatClientError(err), 'chat-send');
      setInput(currentInput);
    }
  };

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <ScreenHeader
        title={displayName ?? '...'}
        onBack={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
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
            key: 'clear',
            label: '清空聊天记录',
            disabled: clearDisabled,
            onSelect: () => {
              // 等 ActionSheet 关闭后再开 Confirm，避免两个 Dialog 抢焦点
              queueMicrotask(() => setConfirmClearOpen(true));
            },
          },
          {
            key: 'delete',
            label: '删除 AI',
            variant: 'danger',
            disabled: deleteDisabled,
            onSelect: () => {
              queueMicrotask(() => setConfirmDeleteOpen(true));
            },
          },
        ]}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title="清空聊天记录"
        description="此操作将清除当前会话的所有消息，且无法恢复。确定继续吗？"
        confirmLabel="清空"
        variant="danger"
        onConfirm={() => void handleConfirmClear()}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="删除 AI"
        description={`确定将「${
          displayName ?? '该 AI'
        }」从通讯录中移除吗？聊天记录将一并删除且无法恢复。`}
        confirmLabel="删除"
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <PageStatus
        loading={isLoading}
        error={isError || !sessionId}
        errorMessage="无法加载会话，请先添加该 AI 好友"
        actionLabel="返回通讯录"
        actionVariant="button"
        onAction={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
      >
        <MessageList
          messages={messages}
          status={status}
          scrollToBottomKey={scrollToBottomKey}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void loadMore()}
          userDisplayName={user?.displayName ?? '我'}
        />
        <SyncPendingReplyBanner visible={isGenerating && !isStreaming} />
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleFormSubmit}
          disabled={inputLocked}
          isStreaming={inputLocked}
        />
      </PageStatus>
    </div>
  );
}
