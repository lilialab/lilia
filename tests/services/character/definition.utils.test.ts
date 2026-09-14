import { AppError } from '@/lib/server/app-error';
import {
  assertCharacterOwner,
  parseCharacterProfile,
  parseCharacterSkills,
  readCharacterFormProfile,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('readCharacterFormProfile', () => {
  it('读出 identity 与性格', () => {
    expect(
      readCharacterFormProfile({
        identity: {
          name: '{{name}}',
          gender: 'female',
          height: '160',
          relation: '朋友',
        },
        personality: ['话短'],
      }),
    ).toEqual({
      gender: 'female',
      height: '160',
      relation: '朋友',
      personality: ['话短'],
    });
  });

  it('缺选填时 gender 可空、其余为 undefined', () => {
    expect(
      readCharacterFormProfile({
        identity: { name: '{{name}}' },
      }),
    ).toEqual({
      gender: '',
      height: undefined,
      relation: undefined,
      personality: undefined,
    });
  });

  it('身高原样返回（含单位）', () => {
    expect(
      readCharacterFormProfile({
        identity: { name: '{{name}}', gender: 'female', height: '147cm' },
      }).height,
    ).toBe('147cm');
  });

  it('无 identity 时抛内部错误', () => {
    expect(() => readCharacterFormProfile({ presence: 'x' })).toThrow(AppError);
  });
});

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
        avatarKey: null,
        updatedAt: new Date('2026-09-13T00:00:00.000Z'),
      }),
    ).toEqual({
      id: 'c1',
      slug: 'lilia',
      name: '莉莉娅',
      shortBio: '朋友',
      hasAvatar: false,
      avatarUpdatedAt: '2026-09-13T00:00:00.000Z',
    });
  });

  it('有 avatarKey 时 hasAvatar 为 true', () => {
    expect(
      toCharacterCatalogItem({
        id: 'c1',
        slug: 'lilia',
        name: '莉莉娅',
        shortBio: '朋友',
        avatarKey: 'characters/c1/a.jpg',
        updatedAt: new Date('2026-09-13T00:00:00.000Z'),
      }).hasAvatar,
    ).toBe(true);
  });
});

describe('assertCharacterOwner', () => {
  it('创建者通过', () => {
    expect(() => assertCharacterOwner('user-1', 'user-1')).not.toThrow();
  });

  it('非创建者或无主时 403', () => {
    try {
      assertCharacterOwner(null, 'user-1');
      expect.unreachable();
    } catch (error: unknown) {
      expect(error).toMatchObject({
        status: 403,
        code: API_ERROR_CODE.CHARACTER_NOT_OWNER,
      });
    }
    try {
      assertCharacterOwner('other', 'user-1');
      expect.unreachable();
    } catch (error: unknown) {
      expect(error).toMatchObject({
        status: 403,
        code: API_ERROR_CODE.CHARACTER_NOT_OWNER,
      });
    }
  });
});
