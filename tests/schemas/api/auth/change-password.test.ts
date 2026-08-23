import { changePasswordBodySchema } from '@/schemas/api/auth/change-password';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('changePasswordBodySchema', () => {
  it('合法 body 通过校验', () => {
    const result = changePasswordBodySchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword',
      confirmNewPassword: 'newpassword',
    });
    expect(result.success).toBe(true);
  });

  it('两次新密码不一致解析失败', () => {
    const result = changePasswordBodySchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
      confirmNewPassword: 'newpassword2',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.PASSWORD_MISMATCH);
  });
});
