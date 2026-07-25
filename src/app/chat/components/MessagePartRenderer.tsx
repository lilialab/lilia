import { MarkdownContent } from '@/components/MarkdownContent';
import { cn } from '@/lib/client/cn';
import type { UIMessage } from 'ai';

type MessagePart = UIMessage['parts'][number];

interface MessagePartRendererProps {
  part: MessagePart;
  index: number;
  isUser: boolean;
}

export function MessagePartRenderer({ part, index, isUser }: MessagePartRendererProps) {
  if (part.type === 'reasoning') {
    return (
      <div
        key={index}
        className={cn(
          'mb-2 rounded border-l-2 p-2 pl-2 text-xs italic',
          isUser
            ? 'border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground/90'
            : 'border-border bg-chat text-muted-foreground',
        )}
      >
        <div
          className={cn(
            'mb-1 text-[10px] font-semibold uppercase tracking-wider not-italic',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          Thinking Process:
        </div>
        <span className={cn('whitespace-pre-wrap')}>{part.text}</span>
      </div>
    );
  }

  if (part.type === 'text') {
    if (isUser) {
      return (
        <span key={index} className={cn('whitespace-pre-wrap')}>
          {part.text}
        </span>
      );
    }

    return <MarkdownContent key={index} content={part.text} />;
  }

  return null;
}
