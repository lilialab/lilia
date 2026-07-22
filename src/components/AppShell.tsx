'use client';

import { DirectionalPageTransition } from '@/components/DirectionalPageTransition';
import { TabBar } from '@/components/TabBar';
import { cn } from '@/lib/client/cn';
import { usePathname } from 'next/navigation';

const TAB_BAR_PATHS = new Set(['/contacts', '/groups', '/me']);

/**
 * 根壳：中间内容走 ViewTransition；TabBar 在过渡外，避免 Tab 切换时底栏闪动。
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabBar = TAB_BAR_PATHS.has(pathname);

  return (
    <div className={cn('flex h-dvh flex-col')}>
      <div className={cn('min-h-0 flex-1 overflow-hidden')}>
        <DirectionalPageTransition>{children}</DirectionalPageTransition>
      </div>
      {showTabBar ? <TabBar /> : null}
    </div>
  );
}
