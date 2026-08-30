import { cn } from '@/lib/client/cn';
import { env } from '@/lib/server/env';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

interface DebugLayoutProps {
  children: ReactNode;
}

export default function DebugLayout({ children }: DebugLayoutProps) {
  if (env.NODE_ENV !== 'development') {
    notFound();
  }

  return (
    <div className={cn('flex h-full flex-col overflow-y-auto bg-surface text-foreground')}>
      {children}
    </div>
  );
}
