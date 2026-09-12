import { AppError } from '@/lib/server/app-error';
import {
  parseCharacterProfile,
  parseCharacterSkills,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { describe, expect, it } from 'vitest';

describe('parseCharacterProfile', () => {
  it('人设对象原样返回', () => {
    expect(
      parseCharacterProfile({
        identity: { name: '{{name}}' },
      }),
    ).toEqual({
      identity: { name: '{{name}}' },
    });
  });

  it('非对象或含已升列字段时抛内部错误', () => {
    expect(() => parseCharacterProfile(null)).toThrow(AppError);
    expect(() => parseCharacterProfile({ name: 'x' })).toThrow(/已升列/);
    expect(() => parseCharacterProfile({ shortBio: '' })).toThrow(/已升列/);
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
        name: '莉莉娅',
        shortBio: '朋友',
      }),
    ).toEqual({
      id: 'c1',
      slug: 'lilia',
      name: '莉莉娅',
      shortBio: '朋友',
    });
  });
});
