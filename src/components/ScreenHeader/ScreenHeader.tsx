'use client';

import { useTranslations } from '@/components/I18nProvider';
import { cn } from '@/lib/client/cn';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

const sideSlotClass = cn('flex min-h-10 min-w-10 shrink-0 items-center');

interface ScreenHeaderProps {
  title: string;
  /** 有则显示返回按钮 */
  onBack?: () => void;
  /** 返回按钮 aria-label；默认随语言（common.back） */
  backAriaLabel?: string;
  right?: ReactNode;
}

/** 通用顶栏：可选返回 / 标题 / 右侧 slot。 */
export function ScreenHeader({
  title,
  onBack,
  backAriaLabel,
  right,
}: ScreenHeaderProps) {
  const t = useTranslations('common');
  const resolvedBackAriaLabel = backAriaLabel ?? t('back');

  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-3',
      )}
    >
      <div className={sideSlotClass}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={resolvedBackAriaLabel}
            className={cn(
              'flex min-h-10 min-w-10 items-center justify-center rounded-md text-foreground/70',
              'hover:bg-surface',
            )}
          >
            <ChevronLeft className={cn('h-5 w-5')} aria-hidden />
          </button>
        )}
      </div>
      <h1
        className={cn(
          'min-w-0 flex-1 truncate px-2 text-center text-base font-medium text-foreground',
        )}
      >
        {title}
      </h1>
      <div className={cn(sideSlotClass, 'justify-end')}>{right}</div>
    </header>
  );
}

interface HeaderIconButtonProps {
  onClick: () => void;
  'aria-label': string;
  disabled?: boolean;
  children: ReactNode;
}

/** 顶栏右侧图标按钮。 */
export function HeaderIconButton({
  onClick,
  'aria-label': ariaLabel,
  disabled,
  children,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground transition-colors',
        'hover:bg-chat hover:text-foreground/80 disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      {children}
    </button>
  );
}
