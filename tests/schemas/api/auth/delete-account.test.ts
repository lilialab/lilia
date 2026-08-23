import { deleteAccountBodySchema } from '@/schemas/api/auth/delete-account';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('deleteAccountBodySchema', () => {
  it('合法删除账号 body 通过校验', () => {
    const result = deleteAccountBodySchema.safeParse({
      currentPassword: 'password123',
      confirmDeletion: true,
    });
    expect(result.success).toBe(true);
  });

  it('未勾选确认时为 DELETE_ACCOUNT_CONFIRMATION_REQUIRED', () => {
    const result = deleteAccountBodySchema.safeParse({
      currentPassword: 'password123',
      confirmDeletion: false,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      API_ERROR_CODE.DELETE_ACCOUNT_CONFIRMATION_REQUIRED,
    );
  });
});
