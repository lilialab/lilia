import { accountSchema } from '@/schemas/shared/account';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('accountSchema', () => {
  it('合法账号通过', () => {
    expect(accountSchema.safeParse('tomuser').success).toBe(true);
    expect(accountSchema.safeParse('tom123').success).toBe(true);
  });

  it('过长为 ACCOUNT_TOO_LONG', () => {
    const result = accountSchema.safeParse('a'.repeat(33));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.ACCOUNT_TOO_LONG);
  });

  it('非法字符为 ACCOUNT_INVALID', () => {
    expect(accountSchema.safeParse('tom-1').success).toBe(false);
    const result = accountSchema.safeParse('tom_user');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.ACCOUNT_INVALID);
  });

  it('非字符串为 ACCOUNT_REQUIRED', () => {
    const result = accountSchema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.ACCOUNT_REQUIRED);
  });
});
