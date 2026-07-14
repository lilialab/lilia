import { describe, expect, it } from 'vitest';
import { loginBodySchema } from '@/schemas/api/auth/login';
import { registerBodySchema } from '@/schemas/api/auth/register';

describe('loginBodySchema', () => {
  it('合法登录 body 通过校验', () => {
    const result = loginBodySchema.safeParse({
      username: 'tom_user',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('密码过短解析失败', () => {
    const result = loginBodySchema.safeParse({
      username: 'tom',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerBodySchema', () => {
  it('合法注册 body 通过校验', () => {
    const result = registerBodySchema.safeParse({
      username: 'tom_user',
      displayName: 'Tom',
      password: 'password123',
      confirmPassword: 'password123',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(true);
  });

  it('两次密码不一致解析失败', () => {
    const result = registerBodySchema.safeParse({
      username: 'tom_user',
      displayName: 'Tom',
      password: 'password123',
      confirmPassword: 'password456',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.success).toBe(false);
  });

  it('非法 timeZone 解析失败', () => {
    const result = registerBodySchema.safeParse({
      username: 'tom_user',
      displayName: 'Tom',
      password: 'password123',
      confirmPassword: 'password123',
      timeZone: 'Not/A/Timezone',
    });
    expect(result.success).toBe(false);
  });

  it('缺省 timeZone 解析失败', () => {
    const result = registerBodySchema.safeParse({
      username: 'tom_user',
      displayName: 'Tom',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
