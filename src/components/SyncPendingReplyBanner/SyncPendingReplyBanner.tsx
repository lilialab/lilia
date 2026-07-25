'use client';

import { cn } from '@/lib/client/cn';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

export const SYNC_PENDING_REPLY_MESSAGE = '正在同步未完成的回复...';

interface SyncPendingReplyBannerProps {
  /** 为 false 时不渲染（调用方可短路，也可传 visible） */
  visible: boolean;
  className?: string;
}

/**
 * 断线后续跑：服务端仍在生成、本地无流时的轻提示（单聊 / 群聊共用）。
 * 相对定位父级（通常包住输入框）时，悬浮在其上方。
 */
export function SyncPendingReplyBanner({ visible, className }: SyncPendingReplyBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-full z-10 flex justify-center px-4 pb-2',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-2 rounded-lg',
          'bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-md opacity-90',
        )}
      >
        <Helix size="16" speed="2.5" color="var(--primary-foreground)" />
        <span>{SYNC_PENDING_REPLY_MESSAGE}</span>
      </div>
    </div>
  );
}
