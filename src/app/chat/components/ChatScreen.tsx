'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRouter } from 'next/navigation';
import { useDefaultSession } from '../hooks/useDefaultSession';
import { useAuth } from '../hooks/useAuth';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/client/cn';
import { formatClientError, showErrorToast } from '@/lib/client/show-error-toast';
import { getBrowserTimeZone } from '@/utils/timezone';

export function ChatScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout, isLoggingOut } = useAuth();
  const { sessionId, isLoading, isError } = useDefaultSession();
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const bumpScroll = useCallback(() => {
    setScrollToBottomKey((k) => k + 1);
  }, []);

  const clientTimeZone = useMemo(() => getBrowserTimeZone(), []);

  const chatTransport = useMemo(() => new DefaultChatTransport({ credentials: 'include' }), []);

  const { messages, status, sendMessage, setMessages } = useChat({
    id: user?.id ?? 'no-user',
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
  const isBootstrapping = isAuthLoading || isLoading;

  const handleConfirmClear = async () => {
    setConfirmClearOpen(false);
    try {
      await clearHistory();
    } catch (err) {
      showErrorToast(formatClientError(err), 'chat-clear');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !sessionId) return;

    const currentInput = input;
    setInput('');

    try {
      await sendMessage(
        { text: currentInput },
        {
          body: { sessionId, clientTimeZone },
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
        user={user}
        onLogout={logout}
        isLoggingOut={isLoggingOut}
        onClear={() => setConfirmClearOpen(true)}
        disabled={clearDisabled}
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

      {isBootstrapping ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          加载中...
        </div>
      ) : isError || !sessionId ? (
        <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
          无法加载会话
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
