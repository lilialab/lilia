import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockResolveSessionUserId = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/env', () => ({
  env: {
    AUTH_SESSION_COOKIE_NAME: 'pai_arbor_session',
  },
}));

vi.mock('@/lib/server/session', () => ({
  resolveSessionUserId: mockResolveSessionUserId,
}));

import { getSessionTokenFromRequest, resolveRequestUserId } from '@/lib/server/request-user';

const SESSION_COOKIE = 'pai_arbor_session';

describe('getSessionTokenFromRequest', () => {
  it('从 Cookie 读取 session token', () => {
    const req = new NextRequest('http://localhost/api/auth/me', {
      headers: { cookie: `${SESSION_COOKIE}=abc123` },
    });
    expect(getSessionTokenFromRequest(req)).toBe('abc123');
  });
});

describe('resolveRequestUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('缺少 Cookie 时抛 401', async () => {
    const req = new NextRequest('http://localhost/api/contacts');
    await expect(resolveRequestUserId(req)).rejects.toMatchObject({
      status: 401,
      message: '未登录',
    });
  });

  it('session 无效时抛 401', async () => {
    mockResolveSessionUserId.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/contacts', {
      headers: { cookie: `${SESSION_COOKIE}=invalid` },
    });

    await expect(resolveRequestUserId(req)).rejects.toMatchObject({
      status: 401,
      message: '登录已过期，请重新登录',
    });
  });

  it('合法 session 返回 userId', async () => {
    mockResolveSessionUserId.mockResolvedValue('user-1');
    const req = new NextRequest('http://localhost/api/contacts', {
      headers: { cookie: `${SESSION_COOKIE}=valid-token` },
    });

    await expect(resolveRequestUserId(req)).resolves.toBe('user-1');
    expect(mockResolveSessionUserId).toHaveBeenCalledWith('valid-token');
  });
});
