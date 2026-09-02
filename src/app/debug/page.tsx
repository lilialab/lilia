import { cn } from '@/lib/client/cn';
import Link from 'next/link';

export default function DebugIndexPage() {
  return (
    <div className={cn('mx-auto flex w-full max-w-3xl flex-col gap-6 p-6')}>
      <div>
        <h1 className={cn('text-lg font-medium')}>Debug</h1>
        <p className={cn('mt-1 text-sm text-muted-foreground')}>
          仅本地。改提示词后刷新再跑即可（development 不缓存 prompt 文件）。
        </p>
      </div>

      <ul className={cn('flex flex-col gap-2 text-sm')}>
        <li>
          <Link className={cn('text-foreground underline')} href="/debug/extract">
            记忆提取
          </Link>
        </li>
        <li>
          <Link className={cn('text-foreground underline')} href="/debug/maintain">
            记忆维护
          </Link>
        </li>
        <li>
          <Link className={cn('text-foreground underline')} href="/debug/profile">
            用户画像
          </Link>
        </li>
        <li className={cn('text-muted-foreground')}>
          Chroma API：
          <code className={cn('ml-1 text-xs')}>/api/debug/chroma</code>
        </li>
        <li className={cn('text-muted-foreground')}>
          记忆任务 API：
          <code className={cn('ml-1 text-xs')}>/api/debug/memory/*</code>
        </li>
      </ul>
    </div>
  );
}
