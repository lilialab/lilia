import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { assertRateLimitsMock } = vi.hoisted(() => ({
  assertRateLimitsMock: vi.fn(),
}));

vi.mock('@/lib/server/rate-limit', () => ({
  assertRateLimits: assertRateLimitsMock,
}));

import {
  assertLoginRateLimit,
  assertRegisterRateLimit,
} from '@/services/user/auth-rate-limit.service';

describe('auth-rate-limit.service', () => {
  beforeEach(() => {
    assertRateLimitsMock.mockReset();
    assertRateLimitsMock.mockResolvedValue(undefined);
  });

  it('注册限流按 IP 检查小时与日窗口', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', {
      headers: {
        'x-forwarded-for': '203.0.113.9',
      },
    });

    await assertRegisterRateLimit(req);

    expect(assertRateLimitsMock).toHaveBeenCalledWith([
      {
        key: 'ratelimit:auth:register:ip:203.0.113.9:1h',
        limit: expect.any(Number),
        windowSeconds: 3600,
      },
      {
        key: 'ratelimit:auth:register:ip:203.0.113.9:1d',
        limit: expect.any(Number),
        windowSeconds: 86400,
      },
    ]);
  });

  it('登录限流按 IP 与规范化用户名检查', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      headers: {
        'x-real-ip': '198.51.100.3',
      },
    });

    await assertLoginRateLimit(req, '  Alice  ');

    expect(assertRateLimitsMock).toHaveBeenCalledWith([
      {
        key: 'ratelimit:auth:login:ip:198.51.100.3:1m',
        limit: expect.any(Number),
        windowSeconds: 60,
      },
      {
        key: 'ratelimit:auth:login:user:alice:15m',
        limit: expect.any(Number),
        windowSeconds: 900,
      },
    ]);
  });

  it('无代理头时 IP 记为 unknown', async () => {
    const req = new NextRequest('http://localhost/api/auth/register');

    await assertRegisterRateLimit(req);

    expect(assertRateLimitsMock).toHaveBeenCalledWith([
      expect.objectContaining({
        key: 'ratelimit:auth:register:ip:unknown:1h',
      }),
      expect.objectContaining({
        key: 'ratelimit:auth:register:ip:unknown:1d',
      }),
    ]);
  });
});
