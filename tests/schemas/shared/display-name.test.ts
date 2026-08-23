import { patchMeBodySchema } from '@/schemas/api/auth/patch-me';
import { displayNameSchema } from '@/schemas/shared/display-name';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('displayNameSchema', () => {
  it('合法昵称通过校验', () => {
    const result = displayNameSchema.safeParse('Tom');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBe('Tom');
  });

  it('首尾空格会被 trim', () => {
    const result = displayNameSchema.safeParse('  Lily  ');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBe('Lily');
  });

  it('空字符串为 DISPLAY_NAME_REQUIRED', () => {
    const result = displayNameSchema.safeParse('   ');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.DISPLAY_NAME_REQUIRED);
  });

  it('超过 64 字符为 DISPLAY_NAME_TOO_LONG', () => {
    const result = displayNameSchema.safeParse('a'.repeat(65));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.DISPLAY_NAME_TOO_LONG);
  });
});

describe('patchMeBodySchema', () => {
  it('接受 locale 更新', () => {
    const result = patchMeBodySchema.safeParse({ locale: 'en' });
    expect(result.success).toBe(true);
  });

  it('接受 displayName 更新', () => {
    const result = patchMeBodySchema.safeParse({ displayName: '新昵称' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({ displayName: '新昵称' });
  });
});
