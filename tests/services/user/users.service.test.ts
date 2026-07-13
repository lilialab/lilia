import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/server/app-error';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { resolveUserIdByUsername } from '@/services/user/users.service';

describe('resolveUserIdByUsername', () => {
  it('用户存在时返回 id', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never);

    await expect(resolveUserIdByUsername('tom')).resolves.toBe('user-1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'tom' },
      select: { id: true },
    });
  });

  it('用户不存在时抛 404', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(resolveUserIdByUsername('missing')).rejects.toMatchObject({
      status: AppError.notFound('').status,
      message: '用户不存在: missing',
    });
  });
});
