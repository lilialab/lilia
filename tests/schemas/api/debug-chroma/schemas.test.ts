import { describe, expect, it } from 'vitest';
import { debugChromaGetQuerySchema } from '@/schemas/api/debug-chroma/get-query';
import { debugChromaDeleteQuerySchema } from '@/schemas/api/debug-chroma/delete-query';
import { debugChromaPostBodySchema } from '@/schemas/api/debug-chroma/post-body';
import { safeParseQueryParams } from '@/schemas/query';

describe('debugChromaGetQuerySchema', () => {
  it('缺省 query 时 pageSize=10', () => {
    const result = safeParseQueryParams(debugChromaGetQuerySchema, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ pageSize: 10 });
    }
  });

  it('合法 name 与 pageSize 通过校验', () => {
    const result = safeParseQueryParams(debugChromaGetQuerySchema, {
      name: 'col1',
      pageSize: '5',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'col1', pageSize: 5 });
    }
  });
});

describe('debugChromaPostBodySchema', () => {
  it('缺省 name 或空 dataArray 解析失败', () => {
    expect(debugChromaPostBodySchema.safeParse({ dataArray: ['a'] }).success).toBe(false);
    expect(debugChromaPostBodySchema.safeParse({ name: 'c', dataArray: [] }).success).toBe(false);
  });

  it('合法 body 通过校验', () => {
    const result = debugChromaPostBodySchema.safeParse({
      name: '  col  ',
      dataArray: ['doc1'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('col');
    }
  });
});

describe('debugChromaDeleteQuerySchema', () => {
  it('缺省 name 解析失败', () => {
    expect(safeParseQueryParams(debugChromaDeleteQuerySchema, {}).success).toBe(false);
  });

  it('合法 name 与 action=reset 通过校验', () => {
    const result = safeParseQueryParams(debugChromaDeleteQuerySchema, {
      name: 'col1',
      action: 'reset',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'col1', action: 'reset' });
    }
  });

  it('非法 action 解析失败', () => {
    expect(
      safeParseQueryParams(debugChromaDeleteQuerySchema, { name: 'col1', action: 'drop' }).success,
    ).toBe(false);
  });
});
