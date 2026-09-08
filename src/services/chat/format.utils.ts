import type { MemoryType } from '@/types/memory';
import { formatLocalClock, formatLocalDateTime } from '@/utils/timezone';
import { intervalToDuration } from 'date-fns';

export interface MemoryFragment {
  text: string;
  type: MemoryType;
  recordedAt: Date;
  lastActiveAt: Date;
}

export function formatUtcIso(date: Date): string {
  return date.toISOString();
}

function formatMemoryFragmentLine(
  index: number,
  fragment: MemoryFragment,
  timeZone: string,
): string {
  const recordedAt = formatLocalDateTime(fragment.recordedAt, timeZone);
  const lastActiveAt = formatLocalDateTime(fragment.lastActiveAt, timeZone);
  const tag = fragment.type === 'event' ? 'event' : 'memory';
  return `[${tag} ${index}] saved ${recordedAt} · last used ${lastActiveAt}: ${fragment.text}`;
}

/** 将检索记忆格式化为 prompt 正文（不含标签；由组装处包 `<memories>`）。 */
export function formatMemories(
  fragments: MemoryFragment[],
  timeZone: string,
): string {
  if (fragments.length === 0) return 'No relevant memories.';
  return fragments
    .map((fragment, index) => formatMemoryFragmentLine(index + 1, fragment, timeZone))
    .join('\n');
}

const IDLE_UNITS = [
  ['y', 'years'],
  ['mo', 'months'],
  ['w', 'weeks'],
  ['d', 'days'],
  ['h', 'hours'],
  ['m', 'minutes'],
] as const;

/** 两条时刻之间的闲置时长；不足 1 分钟为 `under 1m`。 */
export function formatIdleDuration(from: Date, to: Date): string {
  const startMs = from.getTime();
  const endMs = to.getTime();
  const start = startMs <= endMs ? from : to;
  const end = startMs <= endMs ? to : from;
  if (end.getTime() - start.getTime() < 60_000) return 'under 1m';

  const duration = intervalToDuration({ start, end });
  const parts = IDLE_UNITS.flatMap(([suffix, key]) => {
    const value = duration[key];
    return value && value > 0 ? [`${value}${suffix}`] : [];
  });
  return parts.join(' ') || 'under 1m';
}

/** 运行时上下文正文（不含标签；由组装处包 `<runtime_context>`）。 */
export function formatRuntimeContext(
  now: Date,
  timeZone: string,
  previousMessageAt?: Date | null,
): string {
  const clock = formatLocalClock(now, timeZone);
  const lines = [
    `User time zone: ${timeZone}`,
    `UTC offset: ${clock.utcOffset}`,
    `Local date: ${clock.date}`,
    `Weekday: ${clock.weekday}`,
    `Local time: ${clock.time}`,
  ];
  if (!previousMessageAt) return lines.join('\n');

  const last = formatLocalClock(previousMessageAt, timeZone);
  lines.push(`Last message: ${last.date} ${last.time}`);
  lines.push(`Idle: ${formatIdleDuration(previousMessageAt, now)}`);
  return lines.join('\n');
}
