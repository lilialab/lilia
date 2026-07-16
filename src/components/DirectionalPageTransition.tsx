'use client';

import { ViewTransition } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 根布局级 ViewTransition：进聊天推入、返回滑出、Tab 切换淡入淡出。
 * key=pathname 使路由切换时 VT 重挂，走 enter/exit（而非常驻壳的 update）。
 * 跳转处需带 transitionTypes；无类型时 default 为 none。
 */
export function DirectionalPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
      enter={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        tab: 'fade-in',
        default: 'none',
      }}
      exit={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        tab: 'fade-out',
        default: 'none',
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
