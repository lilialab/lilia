import type { HistoryMessage } from '@/client-api/sessions';
import { cn } from '@/lib/client/cn';
import { MessagePartRenderer } from './MessagePartRenderer';
import { MessageRow } from './MessageRow';

interface MessageBubbleProps {
  message: HistoryMessage;
  hideSpeakerName: boolean;
}

export function MessageBubble({ message, hideSpeakerName }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <MessageRow message={message} hideSpeakerName={hideSpeakerName}>
      <div
        className={cn(
          'min-w-0 rounded-lg px-4 py-2 text-base',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'overflow-hidden border border-border/80 bg-background text-foreground shadow-sm',
        )}
      >
        {message.parts?.map((part, idx) => (
          <MessagePartRenderer key={idx} part={part} index={idx} isUser={isUser} />
        ))}
      </div>
    </MessageRow>
  );
}
