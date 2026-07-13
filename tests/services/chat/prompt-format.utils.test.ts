import { describe, expect, it } from 'vitest';
import {
  buildRuntimeContextBlock,
  formatMemoryFragmentLine,
  formatUtcIso,
} from '@/services/chat/prompt-format.utils';

const TIME_ZONE = 'Asia/Shanghai';

describe('formatUtcIso', () => {
  it('输出 ISO 8601 UTC 字符串', () => {
    const iso = formatUtcIso(new Date('2026-03-10T06:00:00.000Z'));
    expect(iso).toBe('2026-03-10T06:00:00.000Z');
    expect(iso.endsWith('Z')).toBe(true);
  });
});

describe('formatMemoryFragmentLine', () => {
  it('非 event 包含序号、记录于、最近活跃于与本地时间', () => {
    const line = formatMemoryFragmentLine(
      1,
      {
        text: '用户偏好短句交流',
        type: 'preference',
        recordedAt: new Date('2026-03-10T06:00:00.000Z'),
        lastActiveAt: new Date('2026-06-20T08:00:00.000Z'),
      },
      TIME_ZONE,
    );
    expect(line).toBe(
      '[记忆片段 1 · 记录于 2026-03-10 14:00:00 · 最近活跃于 2026-06-20 16:00:00]: 用户偏好短句交流',
    );
  });

  it('event 使用系统收录于与最近召回于标签', () => {
    const line = formatMemoryFragmentLine(
      2,
      {
        text: '用户于 2026 年 1 月 1 日 19:00 有重要聚会',
        type: 'event',
        recordedAt: new Date('2026-01-01T05:00:00.000Z'),
        lastActiveAt: new Date('2026-01-01T05:00:00.000Z'),
      },
      TIME_ZONE,
    );
    expect(line).toBe(
      '[记忆片段 2 · 类型 event · 系统收录于 2026-01-01 13:00:00 · 最近召回于 2026-01-01 13:00:00]: 用户于 2026 年 1 月 1 日 19:00 有重要聚会',
    );
  });

  it('记录于与最近活跃于相同时仍输出两个标签', () => {
    const at = new Date('2026-03-10T06:00:00.000Z');
    const line = formatMemoryFragmentLine(
      1,
      {
        text: '用户偏好短句交流',
        type: 'fact',
        recordedAt: at,
        lastActiveAt: at,
      },
      TIME_ZONE,
    );
    expect(line).toBe(
      '[记忆片段 1 · 记录于 2026-03-10 14:00:00 · 最近活跃于 2026-03-10 14:00:00]: 用户偏好短句交流',
    );
  });
});

describe('buildRuntimeContextBlock', () => {
  it('包含用户时区与当前本地时间', () => {
    const block = buildRuntimeContextBlock(new Date('2026-06-26T08:30:00.000Z'), TIME_ZONE);
    expect(block).toContain('<runtime_context>');
    expect(block).toContain('用户时区：Asia/Shanghai');
    expect(block).toContain('当前时间（用户本地）：2026-06-26 16:30:00');
    expect(block).toContain('</runtime_context>');
  });
});
