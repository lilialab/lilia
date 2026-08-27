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

  if (fragment.type === 'event') {
    return `[记忆片段 ${index} · 类型 event · 系统收录于 ${recordedAt} · 最近召回于 ${lastActiveAt}]: ${fragment.text}`;
  }

  return `[记忆片段 ${index} · 记录于 ${recordedAt} · 最近活跃于 ${lastActiveAt}]: ${fragment.text}`;
}

/** 将检索记忆格式化为 prompt 正文；无片段时写占位句。 */
export function formatHistoricalContexts(
  fragments: MemoryFragment[],
  timeZone: string,
): string {
  if (fragments.length === 0) return '暂无相关历史记忆。';
  return fragments
    .map((fragment, index) => formatMemoryFragmentLine(index + 1, fragment, timeZone))
    .join('\n');
}

/** 用 XML 标签包一层正文；开闭标签由调用处写出。 */
export function xmlBlock(tag: string, body: string): string {
  return `<${tag}>\n${body}\n</${tag}>`;
}

/** 运行时上下文正文（不含标签；由组装处包 `<runtime_context>`）。 */
export function formatRuntimeContextInner(now: Date, timeZone: string): string {
  const localNow = formatLocalDateTime(now, timeZone);
  return [
    `用户时区：${timeZone}`,
    `当前时间（用户本地）：${localNow}`,
  ].join('\n');
}
