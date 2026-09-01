import { formatMemories, formatRuntimeContext, formatUtcIso } from '@/services/chat/format.utils';
import { describe, expect, it } from 'vitest';

const TIME_ZONE = 'Asia/Shanghai';

describe('formatUtcIso', () => {
  it('输出 ISO 8601 UTC 字符串', () => {
    const iso = formatUtcIso(new Date('2026-03-10T06:00:00.000Z'));
    expect(iso).toBe('2026-03-10T06:00:00.000Z');
    expect(iso.endsWith('Z')).toBe(true);
  });
});

describe('formatMemories', () => {
  it('非 event 包含序号、saved、last used 与本地时间', () => {
    const text = formatMemories(
      [
        {
          text: '用户偏好短句交流',
          type: 'fact',
          recordedAt: new Date('2026-03-10T06:00:00.000Z'),
          lastActiveAt: new Date('2026-06-20T08:00:00.000Z'),
        },
      ],
      TIME_ZONE,
    );
    expect(text).toBe(
      '[memory 1] saved 2026-03-10 14:00:00 · last used 2026-06-20 16:00:00: 用户偏好短句交流',
    );
  });

  it('event 行以 [event N] 开头，时间戳标签与 memory 相同', () => {
    const text = formatMemories(
      [
        {
          text: '用户于 2026 年 1 月 1 日 19:00 有重要聚会',
          type: 'event',
          recordedAt: new Date('2026-01-01T05:00:00.000Z'),
          lastActiveAt: new Date('2026-01-01T05:00:00.000Z'),
        },
      ],
      TIME_ZONE,
    );
    expect(text).toBe(
      '[event 1] saved 2026-01-01 13:00:00 · last used 2026-01-01 13:00:00: 用户于 2026 年 1 月 1 日 19:00 有重要聚会',
    );
  });

  it('saved 与 last used 相同时仍输出两个标签', () => {
    const at = new Date('2026-03-10T06:00:00.000Z');
    const text = formatMemories(
      [
        {
          text: '用户偏好短句交流',
          type: 'fact',
          recordedAt: at,
          lastActiveAt: at,
        },
      ],
      TIME_ZONE,
    );
    expect(text).toBe(
      '[memory 1] saved 2026-03-10 14:00:00 · last used 2026-03-10 14:00:00: 用户偏好短句交流',
    );
  });

  it('多片段换行拼接', () => {
    const text = formatMemories(
      [
        {
          text: 'a',
          type: 'fact',
          recordedAt: new Date('2026-03-10T06:00:00.000Z'),
          lastActiveAt: new Date('2026-03-10T06:00:00.000Z'),
        },
        {
          text: 'b',
          type: 'fact',
          recordedAt: new Date('2026-03-10T06:00:00.000Z'),
          lastActiveAt: new Date('2026-03-10T06:00:00.000Z'),
        },
      ],
      TIME_ZONE,
    );
    expect(text).toContain(': a');
    expect(text).toContain(': b');
    expect(text).toContain('\n');
  });

  it('无片段时写占位句', () => {
    expect(formatMemories([], TIME_ZONE)).toBe('No relevant memories.');
  });
});

describe('formatRuntimeContext', () => {
  it('包含用户时区与当前本地时间，不含标签', () => {
    const body = formatRuntimeContext(new Date('2026-06-26T08:30:00.000Z'), TIME_ZONE);
    expect(body).toContain('User time zone: Asia/Shanghai');
    expect(body).toContain('Current local time: 2026-06-26 16:30:00');
    expect(body).not.toContain('<runtime_context>');
  });
});
