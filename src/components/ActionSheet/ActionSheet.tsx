'use client';

import { useTranslations } from '@/components/I18nProvider';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/client/cn';
import * as Dialog from '@radix-ui/react-dialog';
import { createContext, type ReactNode, useContext } from 'react';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ActionSheetProps {
  open: boolean;
  title?: string;
  cancelLabel?: string;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  children: ReactNode;
}

interface ActionSheetItemProps {
  children: ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  /** 带头像等左侧内容时用 start；纯文字菜单默认居中 */
  align?: 'center' | 'start';
  onSelect: () => void;
}

const ActionSheetCloseContext = createContext<() => void>(() => {});

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function ActionSheetItem({
  children,
  variant = 'default',
  disabled,
  align = 'center',
  onSelect,
}: ActionSheetItemProps) {
  const onClose = useContext(ActionSheetCloseContext);

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onClose();
          onSelect();
        }}
        className={cn(
          'flex min-h-12 w-full items-center px-4 text-base transition-colors',
          'hover:bg-surface active:bg-surface disabled:pointer-events-none disabled:opacity-40',
          align === 'start' ? 'justify-start gap-3 py-2 text-left' : 'justify-center',
          variant === 'danger' ? 'text-destructive' : 'text-foreground',
        )}
      >
        {children}
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

function ActionSheetRoot({
  open,
  title,
  cancelLabel,
  onClose,
  onCloseAutoFocus,
  children,
}: ActionSheetProps) {
  const tCommon = useTranslations('common');
  const tSheet = useTranslations('actionSheet');
  const resolvedCancelLabel = cancelLabel ?? tCommon('cancel');
  const menuAriaLabel = tSheet('menuAriaLabel');

  return (
    <ActionSheetCloseContext.Provider value={onClose}>
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
            className={cn(
              'overflow-hidden rounded-xl border border-border bg-background shadow-lg',
            )}
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
            <ul className={cn('divide-y divide-border/50')}>{children}</ul>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'mt-2 flex min-h-12 w-full items-center justify-center rounded-xl',
              'border border-border bg-background text-base font-medium text-foreground shadow-lg',
              'transition-colors hover:bg-surface active:bg-surface',
            )}
          >
            {resolvedCancelLabel}
          </button>
        </div>
      </Modal>
    </ActionSheetCloseContext.Provider>
  );
}

/** 底部操作表：点选后关闭；项用 ActionSheet.Item。 */
export const ActionSheet = Object.assign(ActionSheetRoot, { Item: ActionSheetItem });
