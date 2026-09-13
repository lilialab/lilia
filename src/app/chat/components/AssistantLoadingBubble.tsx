'use client';

import type { HistoryMessage } from '@/client-api/sessions';
import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { Mirage } from 'ldrs/react';
import 'ldrs/react/Mirage.css';
import { MessageRow } from './MessageRow';

interface AssistantLoadingBubbleProps {
  message: HistoryMessage;
  hideSpeakerName: boolean;
}

export function AssistantLoadingBubble({ message, hideSpeakerName }: AssistantLoadingBubbleProps) {
  const t = useTranslations('chat');

  return (
    <MessageRow message={message} hideSpeakerName={hideSpeakerName}>
      <div
        className={cn(
          'flex items-center rounded-lg border border-border/80 bg-background px-4 py-3 shadow-sm',
        )}
        role="status"
        aria-label={t('generatingAria')}
      >
        <Mirage size="36" speed="3.5" color="var(--foreground)" />
      </div>
    </MessageRow>
  );
}
