import { AppError } from '@/lib/server/app-error';
import {
  parseCharacterProfile,
  parseCharacterSkills,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { describe, expect, it } from 'vitest';

describe('parseCharacterProfile', () => {
  it('抽出 name/shortBio，其余为人设', () => {
    expect(
      parseCharacterProfile({
        name: '莉莉娅',
        shortBio: '短句',
        identity: { name: '{{name}}' },
      }),
    ).toEqual({
      name: '莉莉娅',
      shortBio: '短句',
      persona: { identity: { name: '{{name}}' } },
    });
  });

  it('trim name', () => {
    expect(parseCharacterProfile({ name: '  凛  ', shortBio: '' }).name).toBe('凛');
  });

  it('非对象或缺少字段时抛内部错误', () => {
    expect(() => parseCharacterProfile(null)).toThrow(AppError);
    expect(() => parseCharacterProfile({ shortBio: '' })).toThrow(/角色人设缺少 name/);
    expect(() => parseCharacterProfile({ name: 'x' })).toThrow(/角色人设缺少 shortBio/);
  });
});

describe('parseCharacterSkills', () => {
  it('接受字符串数组', () => {
    expect(parseCharacterSkills(['searchChatHistory'])).toEqual(['searchChatHistory']);
    expect(parseCharacterSkills([])).toEqual([]);
  });

  it('非字符串数组时抛内部错误', () => {
    expect(() => parseCharacterSkills({ skills: [] })).toThrow(AppError);
    expect(() => parseCharacterSkills(['ok', 1])).toThrow(AppError);
  });
});

describe('toCharacterCatalogItem', () => {
  it('只暴露目录字段', () => {
    expect(
      toCharacterCatalogItem({
        id: 'c1',
        slug: 'lilia',
        profile: { name: '莉莉娅', shortBio: '朋友', presence: '话短' },
      }),
    ).toEqual({
      id: 'c1',
      slug: 'lilia',
      name: '莉莉娅',
      shortBio: '朋友',
    });
  });
});
