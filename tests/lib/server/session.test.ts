import { revokeAllAuthSessions } from '@/lib/server/session';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/env', () => ({
  env: {
    AUTH_SESSION_SECRET: 'test-secret',
    AUTH_SESSION_TTL_DAYS: 7,
    AUTH_SESSION_COOKIE_NAME: 'test_session',
  },
}));

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    authSession: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';

describe('revokeAllAuthSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('删除该用户的全部会话', async () => {
    vi.mocked(prisma.authSession.deleteMany).mockResolvedValue({ count: 2 });

    await revokeAllAuthSessions('user-1');

    expect(prisma.authSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });
});
