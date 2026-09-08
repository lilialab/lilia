import {
  formatIdleDuration,
  formatMemories,
  formatRuntimeContext,
  formatUtcIso,
} from '@/services/chat/format.utils';
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
  it('包含时区、偏移、日期、星期与时刻，不含标签', () => {
    const body = formatRuntimeContext(new Date('2026-06-26T08:30:00.000Z'), TIME_ZONE);
    expect(body).toBe(
      [
        'User time zone: Asia/Shanghai',
        'UTC offset: +08:00',
        'Local date: 2026-06-26',
        'Weekday: Friday',
        'Local time: 16:30',
      ].join('\n'),
    );
    expect(body).not.toContain('<runtime_context>');
  });

  it('有上一条时附带本地时间与 idle', () => {
    const previous = new Date('2026-06-24T04:30:00.000Z');
    const now = new Date('2026-06-26T08:30:00.000Z');
    const body = formatRuntimeContext(now, TIME_ZONE, previous);
    expect(body).toContain('Last message: 2026-06-24 12:30');
    expect(body).toContain('Idle: 2d 4h');
  });
});

describe('formatIdleDuration', () => {
  it('不足 1 分钟为 under 1m', () => {
    const from = new Date('2026-06-26T08:30:00.000Z');
    expect(formatIdleDuration(from, new Date('2026-06-26T08:30:30.000Z'))).toBe('under 1m');
  });

  it('满 1 分钟起算', () => {
    const from = new Date('2026-06-26T08:30:00.000Z');
    expect(formatIdleDuration(from, new Date('2026-06-26T08:31:00.000Z'))).toBe('1m');
  });

  it('组合天与小时', () => {
    const from = new Date('2026-06-24T04:30:00.000Z');
    const to = new Date('2026-06-26T08:30:00.000Z');
    expect(formatIdleDuration(from, to)).toBe('2d 4h');
  });

  it('时刻颠倒时仍取绝对值', () => {
    const earlier = new Date('2026-06-26T08:30:00.000Z');
    const later = new Date('2026-06-26T09:30:00.000Z');
    expect(formatIdleDuration(later, earlier)).toBe('1h');
  });
});
