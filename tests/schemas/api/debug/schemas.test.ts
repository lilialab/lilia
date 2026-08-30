import { debugChromaDeleteQuerySchema } from '@/schemas/api/debug/chroma/delete-query';
import { debugChromaGetQuerySchema } from '@/schemas/api/debug/chroma/get-query';
import { debugChromaPostBodySchema } from '@/schemas/api/debug/chroma/post-body';
import { debugExtractPostBodySchema } from '@/schemas/api/debug/extract/post-body';
import { debugMaintainPostBodySchema } from '@/schemas/api/debug/maintain/post-body';
import { debugProfilePostBodySchema } from '@/schemas/api/debug/profile/post-body';
import { safeParseQueryParams } from '@/schemas/query';
import { describe, expect, it } from 'vitest';

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

describe('debugExtractPostBodySchema', () => {
  it('空 messages 失败', () => {
    expect(
      debugExtractPostBodySchema.safeParse({ characterSlug: 'lilia', messages: [] }).success,
    ).toBe(false);
  });

  it('合法 body 通过', () => {
    const result = debugExtractPostBodySchema.safeParse({
      characterSlug: 'lilia',
      messages: [{ speaker: 'user', text: 'hi' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('debugMaintainPostBodySchema', () => {
  it('空 neighbors 失败', () => {
    expect(
      debugMaintainPostBodySchema.safeParse({
        cursor: { text: '用户喜欢咖啡', type: 'preference', confidence: 0.9 },
        neighbors: [],
      }).success,
    ).toBe(false);
  });

  it('合法 body 通过', () => {
    const result = debugMaintainPostBodySchema.safeParse({
      cursor: { text: '用户喜欢咖啡', type: 'preference', confidence: 0.9 },
      neighbors: [{ text: '用户常点美式', type: 'preference', confidence: 0.8, distance: 0.12 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('debugProfilePostBodySchema', () => {
  it('空 existing 与空 referenceMemories 通过', () => {
    expect(
      debugProfilePostBodySchema.safeParse({
        characterSlug: 'lilia',
        existing: {},
        referenceMemories: [],
      }).success,
    ).toBe(true);
  });

  it('event 类型失败', () => {
    expect(
      debugProfilePostBodySchema.safeParse({
        characterSlug: 'lilia',
        existing: {},
        referenceMemories: [{ text: '明天开会', type: 'event', confidence: 0.9 }],
      }).success,
    ).toBe(false);
  });

  it('合法 body 通过', () => {
    const result = debugProfilePostBodySchema.safeParse({
      characterSlug: 'lilia',
      existing: { communication_style: '短句' },
      referenceMemories: [{ text: '用户反感被说教', type: 'preference', confidence: 0.9 }],
    });
    expect(result.success).toBe(true);
  });
});
