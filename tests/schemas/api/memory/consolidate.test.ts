import { memoryConsolidateQuerySchema } from '@/schemas/api/memory/consolidate';
import { describe, expect, it } from 'vitest';

describe('memoryConsolidateQuerySchema', () => {
  it('接受 sessionId', () => {
    const result = memoryConsolidateQuerySchema.safeParse({
      username: 'tom',
      sessionId: 'sess-1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe('sess-1');
      expect(result.data.groupSessionId).toBeUndefined();
    }
  });

  it('接受 groupSessionId', () => {
    const result = memoryConsolidateQuerySchema.safeParse({
      username: 'tom',
      groupSessionId: 'group-1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.groupSessionId).toBe('group-1');
      expect(result.data.sessionId).toBeUndefined();
    }
  });

  it('拒绝同时缺省', () => {
    expect(memoryConsolidateQuerySchema.safeParse({ username: 'tom' }).success).toBe(false);
  });

  it('拒绝同时指定两者', () => {
    expect(
      memoryConsolidateQuerySchema.safeParse({
        username: 'tom',
        sessionId: 'sess-1',
        groupSessionId: 'group-1',
      }).success,
    ).toBe(false);
  });
});
