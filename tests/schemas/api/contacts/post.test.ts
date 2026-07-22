import { contactCharacterParamsSchema } from '@/schemas/api/contacts/params';
import { addContactBodySchema } from '@/schemas/api/contacts/post';
import { describe, expect, it } from 'vitest';

describe('contacts schemas', () => {
  it('addContactBodySchema 接受非空 characterId', () => {
    expect(addContactBodySchema.parse({ characterId: 'abc' })).toEqual({
      characterId: 'abc',
    });
  });

  it('addContactBodySchema 拒绝空 characterId', () => {
    expect(() => addContactBodySchema.parse({ characterId: '  ' })).toThrow();
  });

  it('contactCharacterParamsSchema 解析路由参数', () => {
    expect(contactCharacterParamsSchema.parse({ characterId: 'uuid-1' })).toEqual({
      characterId: 'uuid-1',
    });
  });
});
