'use client';

import { cn } from '@/lib/client/cn';
import { MessagesSquare, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/contacts', label: '通讯录', icon: Users },
  { href: '/groups', label: '群聊', icon: MessagesSquare },
  { href: '/me', label: '我', icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex shrink-0 border-t border-zinc-200 bg-white',
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-label="主导航"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            transitionTypes={['tab']}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
              active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600',
            )}
          >
            <Icon className={cn('h-6 w-6')} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
