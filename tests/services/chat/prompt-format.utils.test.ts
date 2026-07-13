import { describe, expect, it } from 'vitest';
import {
  buildRuntimeContextBlock,
  formatMemoryFragmentLine,
  formatUtcIso,
} from '@/services/chat/prompt-format.utils';

describe('formatUtcIso', () => {
  it('输出 ISO 8601 UTC 字符串', () => {
    const iso = formatUtcIso(new Date('2026-03-10T06:00:00.000Z'));
    expect(iso).toBe('2026-03-10T06:00:00.000Z');
    expect(iso.endsWith('Z')).toBe(true);
  });
});

describe('formatMemoryFragmentLine', () => {
  it('包含序号、记录于、最近活跃于与 UTC 时间', () => {
    const line = formatMemoryFragmentLine(1, {
      text: '用户偏好短句交流',
      recordedAt: new Date('2026-03-10T06:00:00.000Z'),
      lastActiveAt: new Date('2026-06-20T08:00:00.000Z'),
    });
    expect(line).toBe(
      '[记忆片段 1 · 记录于 2026-03-10T06:00:00.000Z · 最近活跃于 2026-06-20T08:00:00.000Z]: 用户偏好短句交流',
    );
  });

  it('记录于与最近活跃于相同时仍输出两个标签', () => {
    const at = new Date('2026-03-10T06:00:00.000Z');
    const line = formatMemoryFragmentLine(1, {
      text: '用户偏好短句交流',
      recordedAt: at,
      lastActiveAt: at,
    });
    expect(line).toBe(
      '[记忆片段 1 · 记录于 2026-03-10T06:00:00.000Z · 最近活跃于 2026-03-10T06:00:00.000Z]: 用户偏好短句交流',
    );
  });
});

describe('buildRuntimeContextBlock', () => {
  it('包含当前时间 UTC 标签', () => {
    const block = buildRuntimeContextBlock(new Date('2026-06-26T08:30:00.000Z'));
    expect(block).toContain('<runtime_context>');
    expect(block).toContain('当前时间（UTC）：2026-06-26T08:30:00.000Z');
    expect(block).toContain('</runtime_context>');
  });
});
