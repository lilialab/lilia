import { anonymousBodySchema } from '@/schemas/api/auth/anonymous';
import { API_ERROR_CODE } from '@/types/api-error';
import { describe, expect, it } from 'vitest';

describe('anonymousBodySchema', () => {
  it('合法 body 通过校验', () => {
    const result = anonymousBodySchema.safeParse({
      turnstileToken: 'turnstile-token',
      locale: 'zh',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(true);
  });

  it('缺少 turnstileToken 为 TURNSTILE_TOKEN_REQUIRED', () => {
    const result = anonymousBodySchema.safeParse({
      locale: 'zh',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED);
  });

  it('turnstileToken 为空串解析失败', () => {
    const result = anonymousBodySchema.safeParse({
      turnstileToken: '',
      locale: 'zh',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(API_ERROR_CODE.TURNSTILE_TOKEN_REQUIRED);
  });
});
