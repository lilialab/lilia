import { formatLocalClock, formatLocalDateTime, isValidIanaTimeZone } from '@/utils/timezone';
import { describe, expect, it } from 'vitest';

describe('isValidIanaTimeZone', () => {
  it('接受合法 IANA 时区', () => {
    expect(isValidIanaTimeZone('Asia/Shanghai')).toBe(true);
    expect(isValidIanaTimeZone('America/New_York')).toBe(true);
  });

  it('拒绝非法时区', () => {
    expect(isValidIanaTimeZone('Not/A/Timezone')).toBe(false);
    expect(isValidIanaTimeZone('')).toBe(false);
  });
});

describe('formatLocalDateTime', () => {
  it('将 UTC 时刻格式化为东八区本地时间', () => {
    const local = formatLocalDateTime(new Date('2026-01-01T11:00:00.000Z'), 'Asia/Shanghai');
    expect(local).toBe('2026-01-01 19:00:00');
  });

  it('输出 yyyy-MM-dd HH:mm:ss 格式', () => {
    const local = formatLocalDateTime(new Date('2026-06-26T08:30:00.000Z'), 'Asia/Shanghai');
    expect(local).toBe('2026-06-26 16:30:00');
  });
});

describe('formatLocalClock', () => {
  it('东八区给出日期、HH:mm、英文星期与偏移', () => {
    expect(formatLocalClock(new Date('2026-06-26T08:30:00.000Z'), 'Asia/Shanghai')).toEqual({
      date: '2026-06-26',
      time: '16:30',
      weekday: 'Friday',
      utcOffset: '+08:00',
    });
  });

  it('纽约夏令时为 -04:00', () => {
    expect(formatLocalClock(new Date('2026-06-26T08:30:00.000Z'), 'America/New_York')).toEqual({
      date: '2026-06-26',
      time: '04:30',
      weekday: 'Friday',
      utcOffset: '-04:00',
    });
  });

  it('纽约冬令时为 -05:00', () => {
    expect(formatLocalClock(new Date('2026-01-01T11:00:00.000Z'), 'America/New_York')).toEqual({
      date: '2026-01-01',
      time: '06:00',
      weekday: 'Thursday',
      utcOffset: '-05:00',
    });
  });

  it('本地日界线后星期跟着变', () => {
    expect(formatLocalClock(new Date('2026-06-26T16:00:00.000Z'), 'Asia/Shanghai')).toEqual({
      date: '2026-06-27',
      time: '00:00',
      weekday: 'Saturday',
      utcOffset: '+08:00',
    });
  });
});
