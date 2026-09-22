import { cn } from '@/lib/client/cn';

/** 字段标签文字：`Form.Field` 的 label 与 `Form.StringList` 的 legend 共用。 */
export const fieldLabelClass = cn('text-sm font-medium text-foreground');

/** 字段说明文字：标签下方一行小字，比标签更轻。 */
export const fieldHintClass = cn('mt-1 block text-xs font-normal text-muted-foreground');
