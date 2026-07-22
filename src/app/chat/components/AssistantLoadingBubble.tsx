import { cn } from '@/lib/client/cn';

interface AssistantLoadingBubbleProps {
  speakerName?: string;
}

export function AssistantLoadingBubble({ speakerName }: AssistantLoadingBubbleProps) {
  return (
    <div className={cn('flex flex-col items-start gap-1')}>
      {speakerName
        ? (
          <span className={cn('max-w-[85%] truncate px-1 text-xs text-zinc-500')}>
            {speakerName}
          </span>
        )
        : null}
      <div
        className={cn('max-w-[85%] rounded-lg bg-zinc-200 px-4 py-3 text-zinc-900')}
        role="status"
        aria-label="正在生成回复"
      >
        <div className={cn('flex items-center gap-1')}>
          <span
            className={cn(
              'h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]',
            )}
          />
          <span
            className={cn(
              'h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]',
            )}
          />
          <span className={cn('h-2 w-2 animate-bounce rounded-full bg-zinc-400')} />
        </div>
      </div>
    </div>
  );
}
