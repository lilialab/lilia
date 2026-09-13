import { cn } from '@/lib/client/cn';

const sizeClass = {
  xs: 'h-8 w-8 text-[10px]',
  sm: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const;

interface AvatarProps {
  src: string;
  hasAvatar: boolean;
  name: string;
  size?: keyof typeof sizeClass;
}

/** 圆角方头像：有头像显示图，否则名字首字。 */
export function Avatar({ src, hasAvatar, name, size = 'sm' }: AvatarProps) {
  const initial = Array.from(name.trim())[0] ?? '';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg',
        'bg-border font-medium text-foreground/80',
        sizeClass[size],
      )}
    >
      {hasAvatar && (
        // next/image 优化器不带 Cookie，本接口要登录才能读
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={cn('h-full w-full object-cover')} />
      )}
      {!hasAvatar && initial}
    </span>
  );
}
