import { cn } from '@/lib/client/cn';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <div className={cn('flex h-full flex-col bg-zinc-50')}>{children}</div>;
}
