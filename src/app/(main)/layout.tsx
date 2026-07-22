import { cn } from '@/lib/client/cn';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <div className={cn('flex h-full flex-col bg-zinc-50')}>{children}</div>;
}
