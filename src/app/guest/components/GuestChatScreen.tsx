'use client';

import { ChatInput } from '@/app/chat/components/ChatInput';
import { MessageList } from '@/app/chat/components/MessageList';
import {
  fetchGuestCredential,
  type GuestChatOpenSummary,
  issueGuestCredential,
  openGuestChat,
} from '@/client-api/guest';
import type { HistoryMessage } from '@/client-api/sessions';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/auth';
import { useTranslations } from '@/components/I18nProvider';
import { PageStatus } from '@/components/PageStatus';
import { ScreenHeader } from '@/components/ScreenHeader';
import { translateApiError, translateChatApiError } from '@/i18n/client';
import { ApiClientError } from '@/lib/client/api-client';
import { cn } from '@/lib/client/cn';
import { queryKeys } from '@/lib/client/query-keys';
import { showErrorToast } from '@/lib/client/toast';
import { API_ERROR_CODE } from '@/types/api-error';
import { getBrowserTimeZone } from '@/utils/timezone';
import { useChat } from '@ai-sdk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

interface GuestChatScreenProps {
  characterId: string;
  turnstileSiteKey: string;
}

type BootResult =
  | { kind: 'turnstile' }
  | { kind: 'quota'; chat: GuestChatOpenSummary }
  | { kind: 'ready'; chat: GuestChatOpenSummary };

async function bootGuestChat(characterId: string): Promise<BootResult> {
  try {
    await fetchGuestCredential();
  } catch (err) {
    if (
      err instanceof ApiClientError
      && err.code === API_ERROR_CODE.GUEST_TRIAL_REQUIRED
    ) {
      return { kind: 'turnstile' };
    }
    throw err;
  }

  const chat = await openGuestChat(characterId);
  if (chat.remaining <= 0) {
    return { kind: 'quota', chat };
  }
  return { kind: 'ready', chat };
}

export function GuestChatScreen({ characterId, turnstileSiteKey }: GuestChatScreenProps) {
  /* -------------------------------------------------------------------------- */
  /* State & data                                                               */
  /* -------------------------------------------------------------------------- */

  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('trial');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileSubmitting, setTurnstileSubmitting] = useState(false);
  const [quotaForced, setQuotaForced] = useState(false);
  const [input, setInput] = useState('');
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0);

  const bootQuery = useQuery({
    queryKey: queryKeys.guestChatBoot(characterId),
    queryFn: () => bootGuestChat(characterId),
    retry: false,
    meta: { showErrorToast: false },
  });

  const boot = bootQuery.data;
  const showTurnstile = boot?.kind === 'turnstile';
  const showQuota = quotaForced || boot?.kind === 'quota';
  const chat = boot?.kind === 'ready' ? boot.chat : null;
  const chatReady = Boolean(chat);

  const handleTurnstileContinue = async () => {
    if (!turnstileToken) {
      showErrorToast(t('completeVerification'), 'guest-turnstile');
      return;
    }
    setTurnstileSubmitting(true);
    try {
      await issueGuestCredential(turnstileToken);
      await queryClient.invalidateQueries({ queryKey: queryKeys.guestChatBoot(characterId) });
    } catch (err) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      if (
        err instanceof ApiClientError
        && err.code === API_ERROR_CODE.GUEST_TRIAL_DAILY_TURN_LIMIT
      ) {
        setQuotaForced(true);
        return;
      }
      showErrorToast(translateApiError(err), 'guest-credential');
    } finally {
      setTurnstileSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Chat stream                                                                */
  /* -------------------------------------------------------------------------- */

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<HistoryMessage>({
        api: '/api/guest/chat',
        credentials: 'include',
        body: () => ({ timeZone: getBrowserTimeZone() }),
      }),
    [],
  );

  const { messages, status, sendMessage } = useChat<HistoryMessage>({
    id: `guest-${characterId}`,
    throttle: 50,
    transport: chatTransport,
    onError: (err) => {
      const code = (() => {
        try {
          return JSON.parse(err.message)?.code as string | undefined;
        } catch {
          return undefined;
        }
      })();
      if (code === API_ERROR_CODE.GUEST_TRIAL_DAILY_TURN_LIMIT) {
        setQuotaForced(true);
        return;
      }
      showErrorToast(translateChatApiError(err), 'guest-chat-send');
    },
  });

  const isStreaming = status === 'submitted' || status === 'streaming';
  const inputLocked = isStreaming || !chatReady;

  const handleFormSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!input.trim() || inputLocked || !chatReady) return;

    const currentInput = input;
    setInput('');
    setScrollToBottomKey((k) => k + 1);

    try {
      await sendMessage({
        text: currentInput,
        metadata: {
          kind: null,
          slug: null,
          name: t('guestSpeakerName'),
          speakerId: 'guest',
          hasAvatar: false,
          avatarUpdatedAt: '',
        },
      }, { body: { characterId } });
    } catch (err) {
      showErrorToast(translateApiError(err), 'guest-chat-send');
      setInput(currentInput);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  const goBack = () => router.push('/guest', { transitionTypes: ['nav-back'] });

  if (showTurnstile) {
    return (
      <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
        <ScreenHeader title={t('chatTitle')} onBack={goBack} />
        <div className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-6')}>
          <p className={cn('text-center text-sm text-muted-foreground')}>
            {t('turnstileHint')}
          </p>
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            onTokenChange={setTurnstileToken}
          />
          <button
            type="button"
            disabled={!turnstileToken || turnstileSubmitting}
            onClick={() => void handleTurnstileContinue()}
            className={cn(
              'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary-hover active:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {t('startChat')}
          </button>
        </div>
      </div>
    );
  }

  if (showQuota) {
    return (
      <div className={cn('flex h-full flex-col bg-surface text-foreground')}>
        <ScreenHeader title={t('chatTitle')} onBack={goBack} />
        <div className={cn('flex flex-1 flex-col items-center justify-center gap-4 px-6')}>
          <p className={cn('text-center text-sm text-muted-foreground')}>{t('quotaReached')}</p>
          <Link
            href="/register"
            className={cn(
              'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary-hover active:bg-primary-hover',
            )}
          >
            {t('goRegister')}
          </Link>
          <p className={cn('text-center text-sm text-muted-foreground')}>
            {t('hasAccount')}{' '}
            <Link href="/login" className={cn('text-primary underline')}>
              {t('goLogin')}
            </Link>
          </p>
          <button
            type="button"
            onClick={goBack}
            className={cn('text-sm text-primary hover:underline active:underline')}
          >
            {t('backToExplore')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-dvh flex-col bg-chat text-foreground')}>
      <ScreenHeader
        title={chat?.name ?? t('chatTitle')}
        onBack={goBack}
      />

      <PageStatus
        loading={bootQuery.isLoading || turnstileSubmitting}
        error={bootQuery.isError}
        errorMessage={bootQuery.isError ? translateApiError(bootQuery.error) : t('chatLoadError')}
        actionLabel={t('backToExplore')}
        actionVariant="button"
        onAction={goBack}
      >
        <MessageList
          messages={messages}
          status={status}
          scrollToBottomKey={scrollToBottomKey}
          hasMore={false}
          isLoadingMore={false}
          onLoadMore={() => undefined}
          hideSpeakerName
        />
        <div className={cn('relative shrink-0')}>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={(e) => void handleFormSubmit(e)}
            sendLocked={inputLocked}
          />
        </div>
      </PageStatus>
    </div>
  );
}
