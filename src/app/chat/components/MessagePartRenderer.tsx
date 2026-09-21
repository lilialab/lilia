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
  // 思考过程不给用户看。思考期间由 MessageList 的 loading 气泡顶上（见 messageHasVisibleContent）。
  if (part.type === 'reasoning') return null;

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
