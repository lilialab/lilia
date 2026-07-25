import { cn } from '@/lib/client/cn';

export const SYNC_PENDING_REPLY_MESSAGE = '正在同步未完成的回复…';

interface SyncPendingReplyBannerProps {
  /** 为 false 时不渲染（调用方可短路，也可传 visible） */
  visible: boolean;
  className?: string;
}

/** 断线后续跑：服务端仍在生成、本地无流时的轻提示（单聊 / 群聊共用）。 */
export function SyncPendingReplyBanner({ visible, className }: SyncPendingReplyBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'border-t border-zinc-200 bg-zinc-100 px-4 py-2 text-center text-sm text-zinc-500',
        className,
      )}
    >
      {SYNC_PENDING_REPLY_MESSAGE}
    </div>
  );
}
