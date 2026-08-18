'use client';

import { ChatInput } from '@/app/chat/components/ChatInput';
import { MessageList } from '@/app/chat/components/MessageList';
import { useGroupMessageHistory } from '@/app/groups/hooks/useGroupMessageHistory';
import {
  deleteGroup,
  fetchGroup,
  type GroupHistoryMessage,
  type GroupMemberSummary,
} from '@/client-api/groups';
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
import { getBrowserTimeZone } from '@/utils/timezone';
import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  buildUserOutboundMessage,
  MAX_TURN_CUE_HOPS,
  readStoredMentionSlug,
  sendTurnCueIfMentioned,
  writeStoredMentionSlug,
} from './GroupChatScreen.utils';
import { DEFAULT_CHARACTER_SLUG } from './MemberPicker';

interface GroupChatScreenProps {
  groupSessionId: string;
}

export function GroupChatScreen({ groupSessionId }: GroupChatScreenProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useTranslations('groupChat');
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  /** 用户点选；未点选时为 null，selectedMember 再回落 storage → arbor */
  const [pickedMember, setPickedMember] = useState<GroupMemberSummary | null>(null);
  const [inputFocusKey, setInputFocusKey] = useState<number | undefined>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  /** 本轮用户发言后已发出的 turn_cue 次数；用户主动发送时归零 */
  const turnCueHopCountRef = useRef(0);

  const bumpScroll = useCallback(() => {
    setScrollToBottomKey((k) => k + 1);
  }, []);

  const goBackToGroups = useCallback(() => {
    router.push('/groups', { transitionTypes: ['nav-back'] });
  }, [router]);

  const groupQuery = useGeneratingStatusQuery({
    queryKey: queryKeys.group(groupSessionId),
    queryFn: () => fetchGroup(groupSessionId),
    enabled: Boolean(user) && Boolean(groupSessionId),
    retry: false,
    // 失败由 PageStatus 展示，避免全局 QueryCache toast
    meta: { showErrorToast: false },
  });

  const members = groupQuery.data?.members ?? [];
  const selectedMember = pickedMember
    ?? members.find((m) => m.slug === readStoredMentionSlug(groupSessionId))
    ?? members.find((m) => m.slug === DEFAULT_CHARACTER_SLUG);

  /* -------------------------------------------------------------------------- */
  /* Chat stream & history                                                      */
  /* -------------------------------------------------------------------------- */

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<GroupHistoryMessage>({
        api: `/api/groups/${groupSessionId}/chat`,
        credentials: 'include',
        body: () => ({ timeZone: getBrowserTimeZone() }),
      }),
    [groupSessionId],
  );

  const { messages, status, sendMessage, setMessages } = useChat<GroupHistoryMessage>({
    id: `group-${groupSessionId}`,
    experimental_throttle: 50,
    transport: chatTransport,
    onFinish: ({ message, isAbort, isDisconnect, isError }) => {
      if (isAbort || isDisconnect || isError || message.role !== 'assistant') return;

      const result = sendTurnCueIfMentioned({
        assistantParts: message.parts,
        members,
        sendMessage,
        hopCount: turnCueHopCountRef.current,
        maxHops: MAX_TURN_CUE_HOPS,
      });

      if (result === 'sent') {
        turnCueHopCountRef.current += 1;
      } else if (result === 'capped') {
        toast.message(t('turnCueCap'), { id: 'group-turn-cue-cap' });
      }
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

  const isStreaming = status === 'submitted' || status === 'streaming';
  const inputLocked = isStreaming || groupQuery.isGenerating;
  const deleteDisabled = inputLocked;
  const isBootstrapping = groupQuery.isLoading || isInitialLoading;
  const isLoadError = groupQuery.isError || isHistoryError;

  const reloadHistory = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.groupMessageHistory(groupSessionId),
    });
  }, [queryClient, groupSessionId]);

  useOnServerGenerationIdle({
    isGenerating: groupQuery.isGenerating,
    isStreaming,
    onIdle: reloadHistory,
  });

  /* -------------------------------------------------------------------------- */
  /* Handlers                                                                   */
  /* -------------------------------------------------------------------------- */

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
    if (!text || inputLocked || !selectedMember) return;

    const outbound = buildUserOutboundMessage(text, selectedMember.slug);
    writeStoredMentionSlug(groupSessionId, selectedMember.slug);
    setInput('');
    turnCueHopCountRef.current = 0;
    try {
      await sendMessage({
        text: outbound.text,
        metadata: outbound.metadata,
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

  const handleSelectMention = (member: GroupMemberSummary) => {
    setPickedMember(member);
    writeStoredMentionSlug(groupSessionId, member.slug);
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-dvh flex-col bg-chat text-foreground')}>
      <ScreenHeader
        title={groupQuery.data?.title ?? '...'}
        onBack={goBackToGroups}
        right={
          <HeaderIconButton
            aria-label={tChat('moreActions')}
            onClick={() => setMenuOpen(true)}
          >
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
            label: t('manageMembers'),
            disabled: deleteDisabled,
            onSelect: () => {
              router.push(`/groups/${groupSessionId}/members`, {
                transitionTypes: ['nav-forward'],
              });
            },
          },
          {
            key: 'delete',
            label: t('deleteGroup'),
            variant: 'danger',
            disabled: deleteDisabled,
            onSelect: () => {
              queueMicrotask(() => setConfirmDeleteOpen(true));
            },
          },
        ]}
      />

      <ActionSheet
        open={mentionOpen}
        title={t('selectMember')}
        onClose={() => setMentionOpen(false)}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          setInputFocusKey((k) => (k ?? 0) + 1);
        }}
        items={members.map((m) => ({
          key: m.id,
          label: selectedMember?.slug === m.slug
            ? t('currentMember', { name: m.displayName })
            : m.displayName,
          onSelect: () => {
            handleSelectMention(m);
          },
        }))}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('deleteGroup')}
        description={t('deleteDescription', {
          name: groupQuery.data?.title ?? t('thisGroup'),
        })}
        confirmLabel={tChat('deleteConfirm')}
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <PageStatus
        loading={isBootstrapping}
        error={isLoadError}
        errorMessage={t('loadError')}
        actionLabel={t('backToList')}
        onAction={goBackToGroups}
      >
        <MessageList
          messages={messages}
          status={status}
          scrollToBottomKey={scrollToBottomKey}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void handleLoadMore()}
          userDisplayName={user?.displayName ?? tCommon('userFallback')}
        />
        <div className={cn('relative shrink-0')}>
          <SyncPendingReplyBanner visible={groupQuery.isGenerating && !isStreaming} />
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleFormSubmit}
            disabled={inputLocked}
            isStreaming={inputLocked}
            mentionDisplayName={selectedMember?.displayName}
            onMentionClick={selectedMember && !inputLocked ? () => setMentionOpen(true) : undefined}
            focusKey={inputFocusKey}
          />
        </div>
      </PageStatus>
    </div>
  );
}
