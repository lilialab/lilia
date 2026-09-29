import { loginBodySchema } from '@/schemas/api/auth/login';
import { registerBodySchema } from '@/schemas/api/auth/register';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('loginBodySchema', () => {
  it('合法登录 body 通过校验', () => {
    const result = loginBodySchema.safeParse({
      account: 'tomuser',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('密码过短解析失败', () => {
    const result = loginBodySchema.safeParse({
      account: 'tom',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.PASSWORD_TOO_SHORT);
  });

  it('缺少 account 为 ACCOUNT_REQUIRED', () => {
    const result = loginBodySchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.ACCOUNT_REQUIRED);
  });
});

describe('registerBodySchema', () => {
  it('合法注册 body 通过校验', () => {
    const result = registerBodySchema.safeParse({
      account: 'tomuser',
      nickname: 'Tom',
      password: 'password123',
      confirmPassword: 'password123',
      turnstileToken: 'turnstile-token',
      locale: 'en',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(true);
  });

  it('缺少 turnstileToken 为 TURNSTILE_TOKEN_REQUIRED', () => {
    const result = registerBodySchema.safeParse({
      account: 'tomuser',
      nickname: 'Tom',
      password: 'password123',
      confirmPassword: 'password123',
      locale: 'en',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED);
  });

  it('两次密码不一致解析失败', () => {
    const result = registerBodySchema.safeParse({
      account: 'tomuser',
      nickname: 'Tom',
      password: 'password123',
      confirmPassword: 'password456',
      turnstileToken: 'turnstile-token',
      locale: 'zh',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.PASSWORD_MISMATCH);
  });
});
