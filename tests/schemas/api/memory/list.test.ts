import { listMemoryQuerySchema } from '@/schemas/api/memory/list';
import { safeParseQueryParams } from '@/schemas/query';
import { describe, expect, it } from 'vitest';

describe('listMemoryQuerySchema', () => {
  it('缺省 limit 时使用 limit=20', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { username: 'tom' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      username: 'tom',
      limit: 20,
    });
  });

  it('缺少 username 时解析失败', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { limit: '20' });
    expect(result.success).toBe(false);
  });

  it('isMaintained 字符串转为 boolean', () => {
    const trueResult = safeParseQueryParams(listMemoryQuerySchema, {
      username: 'tom',
      isMaintained: 'true',
    });
    expect(trueResult.success).toBe(true);
    if (trueResult.success) {
      expect(trueResult.data.isMaintained).toBe(true);
    }

    const falseResult = safeParseQueryParams(listMemoryQuerySchema, {
      username: 'tom',
      isMaintained: 'false',
    });
    expect(falseResult.success).toBe(true);
    if (falseResult.success) {
      expect(falseResult.data.isMaintained).toBe(false);
    }
  });

  it('空 text= 解析为 undefined', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, { username: 'tom', text: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBeUndefined();
    }
  });

  it('非法 type 解析失败', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, {
      username: 'tom',
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('limit=0 或 limit=101 解析失败', () => {
    expect(
      safeParseQueryParams(listMemoryQuerySchema, { username: 'tom', limit: '0' }).success,
    ).toBe(false);
    expect(
      safeParseQueryParams(listMemoryQuerySchema, { username: 'tom', limit: '101' }).success,
    ).toBe(false);
  });

  it('合法 type 与 limit 通过校验', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, {
      username: 'tom',
      text: '  hello  ',
      type: 'fact',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        username: 'tom',
        text: 'hello',
        type: 'fact',
        limit: 50,
      });
    }
  });

  it('非法 isMaintained 解析失败', () => {
    const result = safeParseQueryParams(listMemoryQuerySchema, {
      username: 'tom',
      isMaintained: 'yes',
    });
    expect(result.success).toBe(false);
  });
});
