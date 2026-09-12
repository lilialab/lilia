import { format, isSameDay, isSameYear, subDays } from 'date-fns';

export interface FormatCommentPostedAtOptions {
  today: string;
  yesterday: string;
  now?: Date;
}

/** 评论发布时间：今天/昨天带文案 + 时刻，同年 MM-dd，跨年带年份。 */
export function formatCommentPostedAt(date: Date, options: FormatCommentPostedAtOptions): string {
  const now = options.now ?? new Date();
  const time = format(date, 'HH:mm');

  if (isSameDay(date, now)) {
    return `${options.today} ${time}`;
  }

  if (isSameDay(date, subDays(now, 1))) {
    return `${options.yesterday} ${time}`;
  }

  if (isSameYear(date, now)) {
    return `${format(date, 'MM-dd')} ${time}`;
  }

  return `${format(date, 'yyyy-MM-dd')} ${time}`;
}
