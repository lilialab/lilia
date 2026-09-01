import type { MemoryType } from '@/types/memory';
import { formatLocalDateTime } from '@/utils/timezone';

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

/** 运行时上下文正文（不含标签；由组装处包 `<runtime_context>`）。 */
export function formatRuntimeContext(now: Date, timeZone: string): string {
  const localNow = formatLocalDateTime(now, timeZone);
  return [
    `User time zone: ${timeZone}`,
    `Current local time: ${localNow}`,
  ].join('\n');
}
