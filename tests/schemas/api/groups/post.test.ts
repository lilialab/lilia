import { groupParamsSchema } from '@/schemas/api/groups/params';
import { replaceGroupMembersBodySchema } from '@/schemas/api/groups/members-put';
import { createGroupBodySchema } from '@/schemas/api/groups/post';
import { describe, expect, it } from 'vitest';

describe('groups schemas', () => {
  it('createGroupBodySchema 拒绝缺省或空 characterIds', () => {
    expect(() => createGroupBodySchema.parse({ title: '测试群' })).toThrow();
    expect(() => createGroupBodySchema.parse({ title: '测试群', characterIds: [] })).toThrow();
  });

  it('createGroupBodySchema 拒绝空 title', () => {
    expect(() => createGroupBodySchema.parse({ title: '  ', characterIds: ['a'] })).toThrow();
  });

  it('createGroupBodySchema 对 characterIds 去重', () => {
    const result = createGroupBodySchema.parse({
      title: '群',
      characterIds: ['a', 'b', 'a', '  c  '],
    });
    expect(result.characterIds).toEqual(['a', 'b', 'c']);
  });

  it('createGroupBodySchema 拒绝空字符串 characterId', () => {
    expect(() => createGroupBodySchema.parse({ title: '群', characterIds: [''] })).toThrow();
  });

  it('replaceGroupMembersBodySchema 接受去重后的 characterIds', () => {
    expect(
      replaceGroupMembersBodySchema.parse({ characterIds: ['a', 'a', '  b  '] }),
    ).toEqual({ characterIds: ['a', 'b'] });
  });

  it('replaceGroupMembersBodySchema 拒绝空列表', () => {
    expect(() => replaceGroupMembersBodySchema.parse({ characterIds: [] })).toThrow();
  });

  it('groupParamsSchema 解析路由参数', () => {
    expect(groupParamsSchema.parse({ id: 'uuid-1' })).toEqual({ id: 'uuid-1' });
  });
});
