import { characterParamsSchema } from '@/schemas/api/characters/params';
import { describe, expect, it } from 'vitest';

describe('characterParamsSchema', () => {
  it('解析路由参数', () => {
    expect(characterParamsSchema.parse({ characterId: 'uuid-1' })).toEqual({
      characterId: 'uuid-1',
    });
  });

  it('拒绝空 characterId', () => {
    expect(() => characterParamsSchema.parse({ characterId: '  ' })).toThrow();
  });
});
