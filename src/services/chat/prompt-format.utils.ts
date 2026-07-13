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

export function formatMemoryFragmentLine(
  index: number,
  fragment: MemoryFragment,
  timeZone: string,
): string {
  const recordedAt = formatLocalDateTime(fragment.recordedAt, timeZone);
  const lastActiveAt = formatLocalDateTime(fragment.lastActiveAt, timeZone);

  if (fragment.type === 'event') {
    return `[记忆片段 ${index} · 类型 event · 系统收录于 ${recordedAt} · 最近召回于 ${lastActiveAt}]: ${fragment.text}`;
  }

  return `[记忆片段 ${index} · 记录于 ${recordedAt} · 最近活跃于 ${lastActiveAt}]: ${fragment.text}`;
}

export function buildRuntimeContextBlock(now: Date, timeZone: string): string {
  const localNow = formatLocalDateTime(now, timeZone);
  return `<runtime_context>
用户时区：${timeZone}
当前时间（用户本地）：${localNow}
</runtime_context>`;
}
