import { describe, expect, it } from 'vitest';
import { createGroupBodySchema } from '@/schemas/api/groups/post';
import { groupParamsSchema } from '@/schemas/api/groups/params';

describe('groups schemas', () => {
  it('createGroupBodySchema 接受 title 与空 characterIds', () => {
    expect(createGroupBodySchema.parse({ title: ' 测试群 ' })).toEqual({
      title: '测试群',
      characterIds: [],
    });
  });

  it('createGroupBodySchema 拒绝空 title', () => {
    expect(() => createGroupBodySchema.parse({ title: '  ' })).toThrow();
  });

  it('createGroupBodySchema 对 characterIds 去重', () => {
    const result = createGroupBodySchema.parse({
      title: '群',
      characterIds: ['a', 'b', 'a', '  c  '],
    });
    expect(result.characterIds).toEqual(['a', 'b', 'c']);
  });

  it('createGroupBodySchema 拒绝空字符串 characterId', () => {
    expect(() =>
      createGroupBodySchema.parse({ title: '群', characterIds: [''] }),
    ).toThrow();
  });

  it('groupParamsSchema 解析路由参数', () => {
    expect(groupParamsSchema.parse({ id: 'uuid-1' })).toEqual({ id: 'uuid-1' });
  });
});
