import { formatDateDivider } from '@/app/chat/utils/date-divider';
import { describe, expect, it } from 'vitest';

describe('formatDateDivider', () => {
  const options = { today: '今天', yesterday: '昨天' };

  it('历史日期用 yyyy-MM-dd', () => {
    expect(formatDateDivider(new Date('2024-06-01T10:00:00.000Z'), options)).toBe('2024-06-01');
  });
});
