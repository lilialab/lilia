import { MoreHorizontal, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/client/cn';

interface ChatHeaderProps {
  characterName: string;
  onBack: () => void;
  onOpenMenu: () => void;
  menuDisabled?: boolean;
}

export function ChatHeader({ characterName, onBack, onOpenMenu, menuDisabled }: ChatHeaderProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 py-3',
      )}
    >
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-600',
          'hover:bg-zinc-50',
        )}
        aria-label="返回通讯录"
      >
        <ChevronLeft className={cn('h-5 w-5')} aria-hidden />
      </button>
      <h1 className={cn('truncate text-base font-medium text-zinc-900')}>
        {characterName || '...'}
      </h1>
      <button
        type="button"
        onClick={onOpenMenu}
        disabled={menuDisabled}
        className={cn(
          'flex min-h-10 min-w-10 items-center justify-center rounded-md text-zinc-500 transition-colors',
          'hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40',
        )}
        aria-label="更多操作"
      >
        <MoreHorizontal className={cn('h-5 w-5')} aria-hidden />
      </button>
    </header>
  );
}
