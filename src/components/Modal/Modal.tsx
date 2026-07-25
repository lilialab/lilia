'use client';

import { cn } from '@/lib/client/cn';
import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  overlayClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** 关闭后自动聚焦回调；可 e.preventDefault() 阻止回到触发器 */
  onCloseAutoFocus?: (event: Event) => void;
}

export function Modal({
  open,
  onClose,
  children,
  className = 'z-50',
  panelClassName,
  overlayClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  onCloseAutoFocus,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn('modal-fade fixed inset-0 bg-overlay', className, overlayClassName)}
        />
        <Dialog.Content
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cn('modal-fade', className, panelClassName)}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
