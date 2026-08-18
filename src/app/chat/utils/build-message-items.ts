import type { HistoryMessage } from '@/client-api/sessions';
import {
  formatDateDivider,
  type FormatDateDividerOptions,
  formatDayKey,
  getMessageDate,
} from './date-divider';

export type MessageListItem = { type: 'divider'; key: string; label: string } | {
  type: 'message';
  message: HistoryMessage;
};

export function buildMessageItems(
  messages: HistoryMessage[],
  divider: FormatDateDividerOptions,
): MessageListItem[] {
  return messages.reduce<{ items: MessageListItem[]; lastDayKey: string | null }>(
    (acc, message) => {
      const date = getMessageDate(message);
      const dayKey = formatDayKey(date);

      if (dayKey !== acc.lastDayKey) {
        acc.items.push({
          type: 'divider',
          key: `divider-${dayKey}`,
          label: formatDateDivider(date, divider),
        });
        acc.lastDayKey = dayKey;
      }

      acc.items.push({ type: 'message', message });
      return acc;
    },
    { items: [], lastDayKey: null },
  ).items;
}
