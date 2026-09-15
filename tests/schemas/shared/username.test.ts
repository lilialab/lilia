import { usernameSchema } from '@/schemas/shared/username';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('usernameSchema', () => {
  it('合法账号通过', () => {
    expect(usernameSchema.safeParse('tomuser').success).toBe(true);
    expect(usernameSchema.safeParse('tom123').success).toBe(true);
  });

  it('过长为 USERNAME_TOO_LONG', () => {
    const result = usernameSchema.safeParse('a'.repeat(33));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.USERNAME_TOO_LONG);
  });

  it('非法字符为 USERNAME_INVALID', () => {
    expect(usernameSchema.safeParse('tom-1').success).toBe(false);
    const result = usernameSchema.safeParse('tom_user');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.USERNAME_INVALID);
  });

  it('非字符串为 USERNAME_REQUIRED', () => {
    const result = usernameSchema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.USERNAME_REQUIRED);
  });
});
