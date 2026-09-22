import { cn } from '@/lib/client/cn';

/** 输入控件外观：无边框灰块 + 聚焦细边。表单控件与聊天输入框共用。 */
export const fieldSurfaceClass = cn(
  'rounded-md border border-transparent bg-chat px-3 py-2 text-base text-foreground',
  'placeholder:text-muted-foreground/60',
  'outline-none focus:border-foreground/25',
);

/** 表单里的输入控件：字段外观 + 表单排版。 */
export const formControlClass = cn('mt-1.5 w-full', fieldSurfaceClass);
