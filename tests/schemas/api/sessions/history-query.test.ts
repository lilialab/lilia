import { describe, expect, it } from 'vitest';
import { sessionHistoryQuerySchema } from '@/schemas/api/sessions/history-query';
import { PAGE_SIZE } from '@/services/chat/message.service';
import { safeParseQueryParams } from '@/schemas/query';

describe('sessionHistoryQuerySchema', () => {
  it('缺省 query 时使用 PAGE_SIZE', () => {
    const result = safeParseQueryParams(sessionHistoryQuerySchema, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(PAGE_SIZE);
      expect(result.data.before).toBeUndefined();
    }
  });

  it('非法 limit 解析失败', () => {
    const result = safeParseQueryParams(sessionHistoryQuerySchema, { limit: 'abc' });
    expect(result.success).toBe(false);
  });

  it('合法 limit 与 before 通过校验', () => {
    const result = safeParseQueryParams(sessionHistoryQuerySchema, {
      limit: '20',
      before: 'msg-1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ limit: 20, before: 'msg-1' });
    }
  });

  it('空 before= 解析为 undefined', () => {
    const result = safeParseQueryParams(sessionHistoryQuerySchema, { before: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.before).toBeUndefined();
    }
  });
});
