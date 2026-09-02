import { getMemoryJobQuerySchema } from '@/schemas/api/debug/memory/jobs';
import { safeParseQueryParams } from '@/schemas/query';
import { describe, expect, it } from 'vitest';

describe('getMemoryJobQuerySchema', () => {
  it('缺省 jobId 解析失败', () => {
    expect(safeParseQueryParams(getMemoryJobQuerySchema, {}).success).toBe(false);
  });

  it('空 jobId 解析失败', () => {
    expect(safeParseQueryParams(getMemoryJobQuerySchema, { jobId: '' }).success).toBe(false);
  });

  it('合法 jobId 通过校验', () => {
    const result = safeParseQueryParams(getMemoryJobQuerySchema, { jobId: '  abc  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.jobId).toBe('abc');
    }
  });
});
