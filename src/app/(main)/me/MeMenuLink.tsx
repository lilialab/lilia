import { cn } from '@/lib/client/cn';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface MeMenuLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** 「我」页菜单行：图标 + 文案 + 右箭头。 */
export function MeMenuLink({ href, label, icon: Icon }: MeMenuLinkProps) {
  return (
    <Link
      href={href}
      transitionTypes={['nav-forward']}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3.5 text-sm text-foreground',
        'hover:bg-row-hover',
      )}
    >
      <Icon className={cn('h-4 w-4 text-muted-foreground')} aria-hidden />
      <span className={cn('flex-1')}>{label}</span>
      <ChevronRight className={cn('h-4 w-4 text-muted-foreground')} aria-hidden />
    </Link>
  );
}
