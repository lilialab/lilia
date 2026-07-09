import { describe, expect, it } from 'vitest';
import { listMemoryQuerySchema } from '@/schemas/api/memory/list';
import { safeParseQueryParams } from '@/schemas/query';

describe('listMemoryQuerySchema', () => {
  it('缺省 query 时使用 userId=default、limit=20', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, {});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      userId: 'default',
      limit: 20,
    });
  });

  it('isMaintained 字符串转为 boolean', () => {
    const trueResult = safeParseQueryParams(listMemoryQuerySchema, { isMaintained: 'true' });
    expect(trueResult.success).toBe(true);
    if (trueResult.success) {
      expect(trueResult.data.isMaintained).toBe(true);
    }

    const falseResult = safeParseQueryParams(listMemoryQuerySchema, { isMaintained: 'false' });
    expect(falseResult.success).toBe(true);
    if (falseResult.success) {
      expect(falseResult.data.isMaintained).toBe(false);
    }
  });

  it('空 text= 解析为 undefined', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { text: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBeUndefined();
    }
  });

  it('空 userId= 回退为 default', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { userId: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe('default');
    }
  });

  it('非法 type 解析失败', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('limit=0 或 limit=101 解析失败', () => {
    expect(safeParseQueryParams(listMemoryQuerySchema, { limit: '0' }).success).toBe(false);
    expect(safeParseQueryParams(listMemoryQuerySchema, { limit: '101' }).success).toBe(false);
  });

  it('合法 type 与 limit 通过校验', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, {
      userId: 'u1',
      text: '  hello  ',
      type: 'fact',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        userId: 'u1',
        text: 'hello',
        type: 'fact',
        limit: 50,
      });
    }
  });

  it('非法 isMaintained 解析失败', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { isMaintained: 'yes' });
    expect(result.success).toBe(false);
  });
});
