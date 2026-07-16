'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCharacterSession } from '../hooks/useCharacterSession';
import { useAuth } from '../hooks/useAuth';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ActionSheet } from '@/components/ActionSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { removeContact } from '@/lib/client/api/contacts';
import { queryKeys } from '@/lib/client/query-keys';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';

interface ChatScreenProps {
  characterId: string;
}

export function ChatScreen({ characterId }: ChatScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { sessionId, displayName, isLoading, isError } = useCharacterSession(characterId);
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const bumpScroll = useCallback(() => {
    setScrollToBottomKey((k) => k + 1);
  }, []);

  const chatTransport = useMemo(() => new DefaultChatTransport({ credentials: 'include' }), []);

  const { messages, status, sendMessage, setMessages } = useChat({
    id: sessionId || `character-${characterId}`,
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
  const clearDisabled = isStreaming || messages.length === 0 || isInitialLoading;
  const deleteDisabled = isStreaming;
  const isBootstrapping = isAuthLoading || isLoading;

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

      router.push('/contacts', { transitionTypes: ['nav-back'] });
    } catch (err) {
      showErrorToast(formatClientError(err), 'chat-delete-contact');
    }
  };

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !sessionId) return;

    const currentInput = input;
    setInput('');

    try {
      await sendMessage(
        { text: currentInput },
        {
          body: { sessionId },
        },
      );
    } catch (err) {
      showErrorToast(formatClientError(err), 'chat-send');
      setInput(currentInput);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user === null) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  if (!isAuthLoading && user === null) {
    return null;
  }

  return (
    <div className={cn('flex h-dvh flex-col bg-zinc-50 text-zinc-900')}>
      <ChatHeader
        characterName={displayName}
        onBack={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
        onOpenMenu={() => setMenuOpen(true)}
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
        description={`确定将「${displayName || '该 AI'}」从通讯录中移除吗？聊天记录将一并删除且无法恢复。`}
        confirmLabel="删除"
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      {isBootstrapping ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          加载中...
        </div>
      ) : isError || !sessionId ? (
        <div className={cn('flex flex-1 flex-col items-center justify-center gap-3 px-4')}>
          <p className={cn('text-sm text-zinc-400')}>无法加载会话，请先添加该 AI 好友</p>
          <button
            type="button"
            onClick={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
            className={cn(
              'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700',
              'hover:bg-zinc-50',
            )}
          >
            返回通讯录
          </button>
        </div>
      ) : (
        <>
          <MessageList
            messages={messages}
            status={status}
            scrollToBottomKey={scrollToBottomKey}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void loadMore()}
          />
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleFormSubmit}
            disabled={isStreaming}
            isStreaming={isStreaming}
          />
        </>
      )}
    </div>
  );
}
