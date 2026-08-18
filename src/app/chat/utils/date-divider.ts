import type { HistoryMessage } from '@/client-api/sessions';
import { format, isToday, isYesterday } from 'date-fns';

export function getMessageDate(message: HistoryMessage): Date {
  if (message.createdAt) {
    return new Date(message.createdAt);
  }
  return new Date();
}

/** 按设备本地日历日分组。 */
export function formatDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export interface FormatDateDividerOptions {
  today: string;
  yesterday: string;
}

/** 日分隔文案；今天/昨天跟设备时区，其余用 yyyy-MM-dd。 */
export function formatDateDivider(date: Date, options: FormatDateDividerOptions): string {
  const { today, yesterday } = options;

  if (isToday(date)) {
    return today;
  }

  if (isYesterday(date)) {
    return yesterday;
  }

  return formatDayKey(date);
}
