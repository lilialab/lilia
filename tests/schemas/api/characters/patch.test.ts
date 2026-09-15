import { updateCharacterBodySchema } from '@/schemas/api/characters/patch';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

function firstIssue(input: unknown): string | undefined {
  const result = updateCharacterBodySchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe('updateCharacterBodySchema', () => {
  it('接受与创建相同的可改字段，不含 slug', () => {
    expect(
      updateCharacterBodySchema.parse({ name: ' 小明 ', shortBio: ' 短句 ', gender: 'female' }),
    ).toEqual({
      name: '小明',
      shortBio: '短句',
      gender: 'female',
    });
  });

  it('忽略传入的 slug', () => {
    expect(
      updateCharacterBodySchema.parse({
        slug: 'hijack',
        name: '小明',
        shortBio: '短句',
        gender: 'female',
      }),
    ).toEqual({
      name: '小明',
      shortBio: '短句',
      gender: 'female',
    });
  });

  it('拒绝空姓名或非法性别', () => {
    expect(firstIssue({ name: '  ', shortBio: '短句', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_NAME_REQUIRED,
    );
    expect(firstIssue({ name: '小明', shortBio: '  ', gender: 'female' })).toBe(
      API_ERROR_CODE.CHARACTER_SHORT_BIO_REQUIRED,
    );
    expect(firstIssue({ name: '小明', shortBio: '短句', gender: 'other' })).toBe(
      API_ERROR_CODE.CHARACTER_GENDER_INVALID,
    );
  });
});
