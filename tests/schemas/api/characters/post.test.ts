import { createCharacterBodySchema } from '@/schemas/api/characters/post';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

function firstIssue(input: unknown): string | undefined {
  const result = createCharacterBodySchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe('createCharacterBodySchema', () => {
  it('接受合法 slug、姓名与性别', () => {
    expect(
      createCharacterBodySchema.parse({ slug: 'my-bot_1', name: ' 小明 ', gender: 'female' }),
    ).toEqual({
      slug: 'my-bot_1',
      name: '小明',
      gender: 'female',
    });
  });

  it('拒绝空 slug 或空姓名', () => {
    expect(firstIssue({ slug: '  ', name: '小明', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SLUG_REQUIRED,
    );
    expect(firstIssue({ slug: 'ok', name: '  ', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_NAME_REQUIRED,
    );
  });

  it('拒绝非法 slug', () => {
    expect(firstIssue({ slug: '莉莉娅', name: '莉莉娅', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SLUG_INVALID,
    );
    expect(firstIssue({ slug: 'has space', name: 'x', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SLUG_INVALID,
    );
  });

  it('拒绝过长 slug', () => {
    expect(firstIssue({ slug: 'a'.repeat(33), name: 'x', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SLUG_TOO_LONG,
    );
  });

  it('选填全空时只保留必填', () => {
    expect(
      createCharacterBodySchema.parse({
        slug: 'ok',
        name: '小明',
        shortBio: '  ',
        gender: 'female',
        height: '',
        relation: '',
        personality: ['  ', ''],
      }),
    ).toEqual({
      slug: 'ok',
      name: '小明',
      shortBio: undefined,
      gender: 'female',
      height: undefined,
      relation: undefined,
      personality: undefined,
    });
  });

  it('保留有内容的选填与 personality', () => {
    expect(
      createCharacterBodySchema.parse({
        slug: 'ok',
        name: '小明',
        shortBio: ' 短句 ',
        gender: 'female',
        height: '147',
        relation: '朋友',
        personality: ['话短', '  '],
      }),
    ).toEqual({
      slug: 'ok',
      name: '小明',
      shortBio: '短句',
      gender: 'female',
      height: '147',
      relation: '朋友',
      personality: ['话短'],
    });
  });

  it('拒绝空性别或非法性别', () => {
    expect(firstIssue({ slug: 'ok', name: '小明' })).toBe(API_ERROR_CODE.CHARACTER_GENDER_REQUIRED);
    expect(firstIssue({ slug: 'ok', name: '小明', gender: '' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_REQUIRED,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', gender: 'other' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_INVALID,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', gender: '女' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_INVALID,
    );
  });

  it('拒绝非法身高', () => {
    expect(firstIssue({ slug: 'ok', name: '小明', gender: 'female', height: '147cm' })).toBe(
      API_ERROR_CODE.CHARACTER_HEIGHT_INVALID,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', gender: 'female', height: '0' })).toBe(
      API_ERROR_CODE.CHARACTER_HEIGHT_INVALID,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', gender: 'female', height: '301' })).toBe(
      API_ERROR_CODE.CHARACTER_HEIGHT_INVALID,
    );
  });
});
