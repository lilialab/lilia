import { AppError } from '@/lib/server/app-error';
import {
  assertCharacterActive,
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
          age: '17',
          height: '160',
          occupation: '学生',
          relation: '朋友',
        },
        personality: ['话短'],
      }),
    ).toEqual({
      gender: 'female',
      age: '17',
      height: '160',
      occupation: '学生',
      relation: '朋友',
      attitude: undefined,
      personality: ['话短'],
      values: undefined,
      dislikes: undefined,
    });
  });

  it('缺选填时 gender 可空、其余为 undefined', () => {
    expect(
      readCharacterFormProfile({
        identity: { name: '{{name}}' },
      }),
    ).toEqual({
      gender: '',
      age: undefined,
      height: undefined,
      occupation: undefined,
      relation: undefined,
      attitude: undefined,
      personality: undefined,
      values: undefined,
      dislikes: undefined,
    });
  });

  it('身高原样返回（含单位）', () => {
    expect(
      readCharacterFormProfile({
        identity: { name: '{{name}}', gender: 'female', height: '147cm' },
      }).height,
    ).toBe('147cm');
  });

  it('读出 attitude / values / dislikes', () => {
    expect(
      readCharacterFormProfile({
        identity: { name: '{{name}}', gender: 'female' },
        attitude: '对人冷淡。',
        values: ['有话直说'],
        dislikes: ['被说教'],
      }),
    ).toEqual({
      gender: 'female',
      age: undefined,
      height: undefined,
      occupation: undefined,
      relation: undefined,
      attitude: '对人冷淡。',
      personality: undefined,
      values: ['有话直说'],
      dislikes: ['被说教'],
    });
  });

  it('无 identity 时抛内部错误', () => {
    expect(() => readCharacterFormProfile({ attitude: 'x' })).toThrow(AppError);
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
        ownerId: null,
        deletedAt: null,
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
        ownerId: null,
        deletedAt: null,
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

describe('assertCharacterActive', () => {
  it('存在且未删通过', () => {
    expect(() => assertCharacterActive({ deletedAt: null })).not.toThrow();
  });

  it('不存在 404', () => {
    try {
      assertCharacterActive(null);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it('已软删 404', () => {
    try {
      assertCharacterActive({ deletedAt: new Date('2026-09-16T00:00:00.000Z') });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ status: 404 });
    }
  });
});
