import { Eraser, LogOut } from 'lucide-react';
import { cn } from '@/lib/client/cn';
import type { AuthUser } from '@/lib/client/api/auth';

interface ChatHeaderProps {
  user: AuthUser | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
  onClear: () => void;
  disabled?: boolean;
}

export function ChatHeader({
  user,
  onLogout,
  isLoggingOut,
  onClear,
  disabled,
}: ChatHeaderProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 py-3',
      )}
    >
      <div className={cn('flex min-w-0 items-center gap-2')}>
        <span className={cn('truncate text-sm text-zinc-600')}>
          {user?.displayName ?? '...'}
        </span>
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1.5 text-xs',
            'text-zinc-600 hover:bg-zinc-50 disabled:opacity-40',
          )}
        >
          <LogOut className={cn('h-3.5 w-3.5')} aria-hidden />
          退出
        </button>
      </div>
      <h1 className={cn('text-base font-medium text-zinc-900')}>pai-arbor</h1>
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        className={cn(
          'flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-500 transition-colors',
          'hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40',
        )}
        aria-label="清空聊天记录"
      >
        <Eraser className={cn('h-5 w-5')} aria-hidden />
      </button>
    </header>
  );
}
