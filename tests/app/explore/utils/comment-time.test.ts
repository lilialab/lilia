import { formatCommentPostedAt } from '@/app/explore/utils/comment-time';
import { describe, expect, it } from 'vitest';

describe('formatCommentPostedAt', () => {
  const now = new Date(2026, 8, 12, 16, 0, 0);
  const options = { today: '今天', yesterday: '昨天', now };

  it('当天带今天和时刻', () => {
    expect(formatCommentPostedAt(new Date(2026, 8, 12, 9, 8), options)).toBe('今天 09:08');
  });

  it('昨天带文案', () => {
    expect(formatCommentPostedAt(new Date(2026, 8, 11, 21, 5), options)).toBe('昨天 21:05');
  });

  it('同年更早显示月日', () => {
    expect(formatCommentPostedAt(new Date(2026, 0, 5, 9, 18), options)).toBe('01-05 09:18');
  });

  it('跨年带年份', () => {
    expect(formatCommentPostedAt(new Date(2025, 8, 12, 9, 18), options)).toBe('2025-09-12 09:18');
  });
});
