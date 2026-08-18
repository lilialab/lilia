'use client';

import { useTranslations } from '@/components/I18nProvider';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/client/cn';
import * as Dialog from '@radix-ui/react-dialog';

export type ActionSheetItem = {
  key: string;
  label: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  onSelect: () => void;
};

interface ActionSheetProps {
  open: boolean;
  title?: string;
  items: ActionSheetItem[];
  cancelLabel?: string;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

export function ActionSheet({
  open,
  title,
  items,
  cancelLabel,
  onClose,
  onCloseAutoFocus,
}: ActionSheetProps) {
  const tCommon = useTranslations('common');
  const tSheet = useTranslations('actionSheet');
  const resolvedCancelLabel = cancelLabel ?? tCommon('cancel');
  const menuAriaLabel = tSheet('menuAriaLabel');

  return (
    <Modal
      open={open}
      onClose={onClose}
      onCloseAutoFocus={onCloseAutoFocus}
      panelClassName={cn(
        'fixed inset-x-0 bottom-0 w-full outline-none',
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-labelledby={title ? 'action-sheet-title' : undefined}
      aria-label={title ? undefined : menuAriaLabel}
    >
      <div className={cn('mx-auto w-full max-w-lg px-3 pb-3 pt-2')}>
        <div
          className={cn('overflow-hidden rounded-xl border border-border bg-background shadow-lg')}
        >
          {title
            ? (
              <Dialog.Title
                id="action-sheet-title"
                className={cn(
                  'border-b border-border/50 px-4 py-3 text-center text-xs font-medium text-muted-foreground',
                )}
              >
                {title}
              </Dialog.Title>
            )
            : <Dialog.Title className={cn('sr-only')}>{menuAriaLabel}</Dialog.Title>}
          <ul className={cn('divide-y divide-border/50')}>
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    onClose();
                    item.onSelect();
                  }}
                  className={cn(
                    'flex min-h-12 w-full items-center justify-center px-4 text-base transition-colors',
                    'hover:bg-surface disabled:pointer-events-none disabled:opacity-40',
                    item.variant === 'danger' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'mt-2 flex min-h-12 w-full items-center justify-center rounded-xl',
            'border border-border bg-background text-base font-medium text-foreground shadow-lg',
            'transition-colors hover:bg-surface',
          )}
        >
          {resolvedCancelLabel}
        </button>
      </div>
    </Modal>
  );
}
