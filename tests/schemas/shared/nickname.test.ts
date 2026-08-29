import { patchMeBodySchema } from '@/schemas/api/auth/patch-me';
import { nicknameSchema } from '@/schemas/shared/nickname';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('nicknameSchema', () => {
  it('合法昵称通过校验', () => {
    const result = nicknameSchema.safeParse('Tom');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBe('Tom');
  });

  it('首尾空格会被 trim', () => {
    const result = nicknameSchema.safeParse('  Lily  ');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBe('Lily');
  });

  it('空字符串为 NICKNAME_REQUIRED', () => {
    const result = nicknameSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.NICKNAME_REQUIRED);
  });

  it('超过 64 字符为 NICKNAME_TOO_LONG', () => {
    const result = nicknameSchema.safeParse('a'.repeat(65));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.NICKNAME_TOO_LONG);
  });
});

describe('patchMeBodySchema', () => {
  it('接受 locale 更新', () => {
    const result = patchMeBodySchema.safeParse({ locale: 'en' });
    expect(result.success).toBe(true);
  });

  it('接受 nickname 更新', () => {
    const result = patchMeBodySchema.safeParse({ nickname: '新昵称' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({ nickname: '新昵称' });
  });
});
