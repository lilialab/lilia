'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/client/cn';

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
}

export function ActionSheet({
  open,
  title,
  items,
  cancelLabel = '取消',
  onClose,
}: ActionSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      panelClassName={cn(
        'fixed inset-x-0 bottom-0 w-full outline-none',
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-labelledby={title ? 'action-sheet-title' : undefined}
      aria-label={title ? undefined : '操作菜单'}
    >
      <div className={cn('mx-auto w-full max-w-lg px-3 pb-3 pt-2')}>
        <div className={cn('overflow-hidden rounded-xl bg-white shadow-lg')}>
          {title ? (
            <Dialog.Title
              id="action-sheet-title"
              className={cn(
                'border-b border-zinc-100 px-4 py-3 text-center text-xs font-medium text-zinc-400',
              )}
            >
              {title}
            </Dialog.Title>
          ) : (
            <Dialog.Title className={cn('sr-only')}>操作菜单</Dialog.Title>
          )}
          <ul className={cn('divide-y divide-zinc-100')}>
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
                    'hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40',
                    item.variant === 'danger' ? 'text-red-600' : 'text-zinc-900',
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
            'mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-white',
            'text-base font-medium text-zinc-900 shadow-lg transition-colors hover:bg-zinc-50',
          )}
        >
          {cancelLabel}
        </button>
      </div>
    </Modal>
  );
}
