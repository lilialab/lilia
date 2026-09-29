import { AppError } from '@/lib/server/app-error';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { authenticateUser, resolveUserIdByAccount } from '@/services/user/users.service';

describe('authenticateUser', () => {
  it('匿名账号（无密码哈希）不通过密码登录', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: null,
    } as never);

    await expect(authenticateUser('anon', 'whatever')).rejects.toMatchObject({
      status: AppError.badRequest('').status,
      message: '账号或密码错误',
    });
  });
});

describe('resolveUserIdByAccount', () => {
  it('用户存在时返回 id', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);

    await expect(resolveUserIdByAccount('tom')).resolves.toBe('user-1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { account: 'tom' },
      select: { id: true },
    });
  });

  it('用户不存在时抛 404', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(resolveUserIdByAccount('missing')).rejects.toMatchObject({
      status: AppError.notFound('').status,
      message: '用户不存在: missing',
    });
  });
});
