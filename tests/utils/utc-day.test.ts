import { formatUtcDate, secondsUntilNextUtcMidnight } from '@/utils/utc-day';
import { describe, expect, it } from 'vitest';

describe('utc-day', () => {
  it('formatUtcDate 按 UTC 日历日输出', () => {
    expect(formatUtcDate(new Date('2026-08-24T23:59:59.000Z'))).toBe('2026-08-24');
    expect(formatUtcDate(new Date('2026-08-25T00:00:00.000Z'))).toBe('2026-08-25');
  });

  it('secondsUntilNextUtcMidnight 在午夜前一秒为 1', () => {
    expect(secondsUntilNextUtcMidnight(new Date('2026-08-24T23:59:59.400Z'))).toBe(1);
  });

  it('secondsUntilNextUtcMidnight 在 UTC 零点为整日秒数', () => {
    expect(secondsUntilNextUtcMidnight(new Date('2026-08-24T00:00:00.000Z'))).toBe(86400);
  });
});
