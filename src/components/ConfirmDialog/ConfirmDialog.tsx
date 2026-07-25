'use client';

import { Modal } from '@/components/Modal';
import { cn } from '@/lib/client/cn';
import * as Dialog from '@radix-ui/react-dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      panelClassName={cn(
        'fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
        'rounded-lg border border-border bg-background p-5 text-foreground shadow-xl focus:outline-none',
      )}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <Dialog.Title
        id="confirm-dialog-title"
        className={cn('text-base font-semibold text-foreground')}
      >
        {title}
      </Dialog.Title>
      <Dialog.Description
        id="confirm-dialog-description"
        className={cn('mt-2 text-sm leading-relaxed text-muted-foreground')}
      >
        {description}
      </Dialog.Description>
      <div className={cn('mt-6 flex justify-end gap-2')}>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'min-h-10 rounded-md px-4 text-sm font-medium text-muted-foreground',
            'transition-colors hover:bg-surface hover:text-foreground',
          )}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'min-h-10 rounded-md px-4 text-sm font-medium transition-colors',
            variant === 'danger'
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive-hover'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
