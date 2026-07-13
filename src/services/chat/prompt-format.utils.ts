export interface MemoryFragment {
  text: string;
  recordedAt: Date;
  lastActiveAt: Date;
}

export function formatUtcIso(date: Date): string {
  return date.toISOString();
}

export function formatMemoryFragmentLine(index: number, fragment: MemoryFragment): string {
  const recordedAt = formatUtcIso(fragment.recordedAt);
  const lastActiveAt = formatUtcIso(fragment.lastActiveAt);
  return `[记忆片段 ${index} · 记录于 ${recordedAt} · 最近活跃于 ${lastActiveAt}]: ${fragment.text}`;
}

export function buildRuntimeContextBlock(now: Date): string {
  return `<runtime_context>
当前时间（UTC）：${formatUtcIso(now)}
</runtime_context>`;
}
