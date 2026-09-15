import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

export const BADGE_COLORS = ['neutral', 'red', 'yellow', 'blue', 'green'] as const;
export type BadgeColor = (typeof BADGE_COLORS)[number];

const colorClass: Record<BadgeColor, string> = {
  neutral: 'border-border text-muted-foreground',
  red: 'border-red-400/40 bg-red-500/10 text-red-600 dark:text-red-400',
  yellow: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  blue: 'border-blue-400/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'border-green-400/40 bg-green-500/10 text-green-700 dark:text-green-400',
};

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

/** 小标签：neutral / red / yellow / blue / green。 */
export function Badge({ children, color = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md border px-1.5 py-px text-[10px]',
        colorClass[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
