import { cn } from '@/lib/client/cn';
import type { ReactNode } from 'react';

interface PageStatusProps {
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 错误操作按钮样式；默认 link */
  actionVariant?: 'link' | 'button';
  children?: ReactNode;
}

/** 全页居中：加载中 / 错误（可选操作）/ 正常内容。 */
export function PageStatus({
  loading = false,
  error = false,
  errorMessage,
  actionLabel,
  onAction,
  actionVariant = 'link',
  children,
}: PageStatusProps) {
  if (loading) {
    return (
      <div className={cn('flex flex-1 items-center justify-center text-sm text-muted-foreground')}>
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-3 px-6')}>
        {errorMessage && <p className={cn('text-sm text-muted-foreground')}>{errorMessage}</p>}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              actionVariant === 'button'
                && 'rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface',
              actionVariant === 'link' && 'text-sm text-primary hover:underline',
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return children;
}
