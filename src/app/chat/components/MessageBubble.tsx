import type { HistoryMessage } from '@/client-api/sessions';
import { cn } from '@/lib/client/cn';
import { MessagePartRenderer } from './MessagePartRenderer';

interface MessageBubbleProps {
  message: HistoryMessage;
  /** 用户气泡显示名，默认「我」 */
  userDisplayName?: string;
}

export function MessageBubble({ message, userDisplayName = '我' }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const speakerName = isUser ? userDisplayName : message.metadata?.speakerDisplayName;

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      {speakerName && (
        <span className={cn('max-w-[85%] truncate px-1 text-xs text-muted-foreground')}>
          {speakerName}
        </span>
      )}
      <div
        className={cn(
          'max-w-[85%] min-w-0 rounded-lg px-4 py-2 text-base',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'overflow-hidden border border-border/80 bg-background text-foreground shadow-sm',
        )}
      >
        {message.parts?.map((part, idx) => (
          <MessagePartRenderer key={idx} part={part} index={idx} isUser={isUser} />
        ))}
      </div>
    </div>
  );
}
