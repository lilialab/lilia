'use client';

import { cn } from '@/lib/client/cn';
import { Mirage } from 'ldrs/react';
import 'ldrs/react/Mirage.css';

interface AssistantLoadingBubbleProps {
  speakerName?: string;
}

export function AssistantLoadingBubble({ speakerName }: AssistantLoadingBubbleProps) {
  return (
    <div className={cn('flex flex-col items-start gap-1')}>
      {speakerName && (
        <span className={cn('max-w-[85%] truncate px-1 text-xs text-muted-foreground')}>
          {speakerName}
        </span>
      )}
      <div
        className={cn(
          'flex max-w-[85%] items-center rounded-lg border border-border/80 bg-background px-4 py-3 shadow-sm',
        )}
        role="status"
        aria-label="正在生成回复"
      >
        <Mirage size="36" speed="3.5" color="var(--foreground)" />
      </div>
    </div>
  );
}
