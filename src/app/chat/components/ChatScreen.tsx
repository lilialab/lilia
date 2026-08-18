'use client';

import { fetchContactSession, removeContact } from '@/client-api/contacts';
import type { HistoryMessage } from '@/client-api/sessions';
import { ActionSheet } from '@/components/ActionSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { SyncPendingReplyBanner } from '@/components/SyncPendingReplyBanner';
import { useAuth } from '@/hooks/useAuth';
import { useGeneratingStatusQuery } from '@/hooks/useGeneratingStatusQuery';
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
import { useMessageHistory } from '../hooks/useMessageHistory';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

interface ChatScreenProps {
  characterId: string;
}

export function ChatScreen({ characterId }: ChatScreenProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const sessionQuery = useGeneratingStatusQuery({
    queryKey: queryKeys.characterSession(characterId),
    queryFn: () => fetchContactSession(characterId),
    enabled: Boolean(characterId),
    retry: false,
    // 失败由 PageStatus 展示，避免全局 QueryCache toast
    meta: { showErrorToast: false },
  });

  const sessionId = sessionQuery.data?.sessionId ?? '';
  const displayName = sessionQuery.data?.displayName ?? '';

  const bumpScroll = useCallback(() => {
    setScrollToBottomKey((k) => k + 1);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Chat stream & history                                                      */
  /* -------------------------------------------------------------------------- */

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<HistoryMessage>({
        api: '/api/chat',
        credentials: 'include',
      }),
    [],
  );

  const { messages, status, sendMessage, setMessages } = useChat<HistoryMessage>({
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
  const inputLocked = isStreaming || sessionQuery.isGenerating;

  const reloadHistory = useCallback(() => {
    if (!sessionId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.messageHistory(sessionId) });
  }, [queryClient, sessionId]);

  useOnServerGenerationIdle({
    isGenerating: sessionQuery.isGenerating,
    isStreaming,
    onIdle: reloadHistory,
  });

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-chat text-foreground')}>
      <ScreenHeader
        title={displayName || '...'}
        onBack={() => router.push('/contacts', { transitionTypes: ['nav-back'] })}
        right={
          <HeaderIconButton aria-label={t('moreActions')} onClick={() => setMenuOpen(true)}>
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
            label: t('clearHistory'),
            disabled: clearDisabled,
            onSelect: () => {
              // 等 ActionSheet 关闭后再开 Confirm，避免两个 Dialog 抢焦点
              queueMicrotask(() => setConfirmClearOpen(true));
            },
          },
          {
            key: 'delete',
            label: t('deleteAi'),
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
        title={t('clearHistory')}
        description={t('clearHistoryDescription')}
        confirmLabel={t('clearConfirm')}
        variant="danger"
        onConfirm={() => void handleConfirmClear()}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('deleteAi')}
        description={t('deleteAiDescription', { name: displayName || t('thisAi') })}
        confirmLabel={t('deleteConfirm')}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <PageStatus
        loading={sessionQuery.isLoading}
        error={sessionQuery.isError || !sessionId}
        errorMessage={t('loadError')}
        actionLabel={t('backToContacts')}
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
          userDisplayName={user?.displayName ?? tCommon('userFallback')}
        />
        <div className={cn('relative shrink-0')}>
          <SyncPendingReplyBanner visible={sessionQuery.isGenerating && !isStreaming} />
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleFormSubmit}
            disabled={inputLocked}
            isStreaming={inputLocked}
          />
        </div>
      </PageStatus>
    </div>
  );
}
