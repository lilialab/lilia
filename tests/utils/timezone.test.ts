import { describe, expect, it } from 'vitest';
import { formatLocalDateTime, isValidIanaTimeZone } from '@/utils/timezone';

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
