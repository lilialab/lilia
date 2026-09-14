import { AppError } from '@/lib/server/app-error';
import { assertAvatarBytes } from '@/lib/server/avatar';
import { API_ERROR_CODE } from '@/types/api-error';
import { AVATAR_MAX_BYTES } from '@/utils/avatar';
import { describe, expect, it } from 'vitest';

function expectAvatarError(bytes: Uint8Array, code: string) {
  try {
    assertAvatarBytes(bytes);
    expect.unreachable();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status: 400, code });
  }
}

describe('assertAvatarBytes', () => {
  it('空内容 400', () => {
    expectAvatarError(new Uint8Array(), API_ERROR_CODE.AVATAR_REQUIRED);
  });

  it('超过 5MB 400', () => {
    const tooLarge = new Uint8Array(AVATAR_MAX_BYTES + 1);
    tooLarge[0] = 0xff;
    tooLarge[1] = 0xd8;
    tooLarge[2] = 0xff;
    expectAvatarError(tooLarge, API_ERROR_CODE.AVATAR_TOO_LARGE);
  });

  it('非 jpeg/png/webp 400', () => {
    expectAvatarError(
      Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
      API_ERROR_CODE.AVATAR_INVALID_TYPE,
    );
  });

  it('合法 jpeg 返回 kind', () => {
    expect(assertAvatarBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
  });
});
