import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

interface ExploreBadgeProps {
  children: ReactNode;
}

export function ExploreBadge({ children }: ExploreBadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md border border-border px-1.5 py-px text-[10px] text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}
