import { createCharacterBodySchema } from '@/schemas/api/characters/post';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

function firstIssue(input: unknown): string | undefined {
  const result = createCharacterBodySchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe('createCharacterBodySchema', () => {
  it('接受合法 slug、姓名、简介与性别', () => {
    expect(
      createCharacterBodySchema.parse({
        slug: 'my_bot_1',
        name: ' 小明 ',
        shortBio: ' 短句 ',
        gender: 'female',
      }),
    ).toEqual({
      slug: 'my_bot_1',
      name: '小明',
      shortBio: '短句',
      gender: 'female',
    });
  });

  it('拒绝空 slug、空姓名或空简介', () => {
    expect(firstIssue({ slug: '  ', name: '小明', shortBio: '短句', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SLUG_REQUIRED,
    );
    expect(firstIssue({ slug: 'ok', name: '  ', shortBio: '短句', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_NAME_REQUIRED,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', shortBio: '  ', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SHORT_BIO_REQUIRED,
    );
  });

  it('拒绝非法 slug', () => {
    expect(
      firstIssue({ slug: '莉莉娅', name: '莉莉娅', shortBio: '短句', gender: 'female' }),
    ).toBe(API_ERROR_CODE.CHARACTER_SLUG_INVALID);
    expect(
      firstIssue({ slug: 'has space', name: 'x', shortBio: '短句', gender: 'female' }),
    ).toBe(API_ERROR_CODE.CHARACTER_SLUG_INVALID);
    expect(firstIssue({ slug: 'my-bot', name: 'x', shortBio: '短句', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SLUG_INVALID,
    );
  });

  it('拒绝过长 slug', () => {
    expect(
      firstIssue({ slug: 'a'.repeat(33), name: 'x', shortBio: '短句', gender: 'female' }),
    ).toBe(API_ERROR_CODE.CHARACTER_SLUG_TOO_LONG);
  });

  it('拒绝过长简介', () => {
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: 'a'.repeat(81), gender: 'female' }),
    ).toBe(API_ERROR_CODE.CHARACTER_SHORT_BIO_TOO_LONG);
  });

  it('选填全空时只保留必填', () => {
    expect(
      createCharacterBodySchema.parse({
        slug: 'ok',
        name: '小明',
        shortBio: '短句',
        gender: 'female',
        age: '',
        height: '',
        occupation: '',
        relation: '',
        personality: ['  ', ''],
        attitude: '  ',
        values: ['  '],
        dislikes: [],
      }),
    ).toEqual({
      slug: 'ok',
      name: '小明',
      shortBio: '短句',
      gender: 'female',
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

  it('保留有内容的选填与 personality', () => {
    expect(
      createCharacterBodySchema.parse({
        slug: 'ok',
        name: '小明',
        shortBio: ' 短句 ',
        gender: 'female',
        age: '17',
        height: '147',
        occupation: '学生',
        relation: '朋友',
        personality: ['话短', '  '],
        attitude: ' 对人冷淡。 ',
        values: ['有话直说'],
        dislikes: ['被说教'],
      }),
    ).toEqual({
      slug: 'ok',
      name: '小明',
      shortBio: '短句',
      gender: 'female',
      age: '17',
      // 入参是纯数字（数字键盘 + 范围校验），落库时固化单位，直接进 prompt 不含糊
      height: '147cm',
      occupation: '学生',
      relation: '朋友',
      personality: ['话短'],
      attitude: '对人冷淡。',
      values: ['有话直说'],
      dislikes: ['被说教'],
    });
  });

  it('拒绝空性别或非法性别', () => {
    expect(firstIssue({ slug: 'ok', name: '小明', shortBio: '短句' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_REQUIRED,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: '' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_REQUIRED,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'other' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_INVALID,
    );
    expect(firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: '女' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_INVALID,
    );
  });

  it('拒绝非法身高', () => {
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'female', height: '147cm' }),
    ).toBe(API_ERROR_CODE.CHARACTER_HEIGHT_INVALID);
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'female', height: '0' }),
    ).toBe(API_ERROR_CODE.CHARACTER_HEIGHT_INVALID);
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'female', height: '301' }),
    ).toBe(API_ERROR_CODE.CHARACTER_HEIGHT_INVALID);
  });

  it('拒绝非法年龄', () => {
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'female', age: '17岁' }),
    ).toBe(API_ERROR_CODE.CHARACTER_AGE_INVALID);
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'female', age: '0' }),
    ).toBe(API_ERROR_CODE.CHARACTER_AGE_INVALID);
    expect(
      firstIssue({ slug: 'ok', name: '小明', shortBio: '短句', gender: 'female', age: '151' }),
    ).toBe(API_ERROR_CODE.CHARACTER_AGE_INVALID);
  });
});
