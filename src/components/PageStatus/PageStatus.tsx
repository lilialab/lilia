import type { ReactNode } from 'react';
import { cn } from '@/lib/client/cn';

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
      <div className={cn('flex flex-1 items-center justify-center text-sm text-zinc-400')}>
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-3 px-6')}>
        {errorMessage && <p className={cn('text-sm text-zinc-400')}>{errorMessage}</p>}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              actionVariant === 'button' &&
                'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50',
              actionVariant === 'link' && 'text-sm text-blue-600 hover:underline',
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
