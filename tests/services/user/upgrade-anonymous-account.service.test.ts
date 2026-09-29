import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { hashPassword } from '@/lib/server/password';
import { prisma } from '@/lib/server/prisma';
import { upgradeAnonymousAccount } from '@/services/user/users.service';

const input = { account: 'u_NEW', nickname: '新昵称', password: 'new-password' };

describe('upgradeAnonymousAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hashPassword).mockResolvedValue('new-hash');
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);
  });

  it('匿名账号就地升级：补哈希、改账号名与昵称，仍是同一个 userId', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: 'user-1', passwordHash: null } as never)
      .mockResolvedValueOnce(null);

    await upgradeAnonymousAccount('user-1', input);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', passwordHash: null },
      data: { account: 'u_NEW', nickname: '新昵称', passwordHash: 'new-hash' },
    });
  });

  it('账号名被他人占用时抛 400', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: 'user-1', passwordHash: null } as never)
      .mockResolvedValueOnce({ id: 'user-2' } as never);

    await expect(upgradeAnonymousAccount('user-1', input)).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.ACCOUNT_TAKEN,
    });

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('已设过密码的账号不能再升级', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: 'existing-hash',
    } as never);

    await expect(upgradeAnonymousAccount('user-1', input)).rejects.toMatchObject({ status: 409 });

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('并发下条件写没命中（count=0）时抛 409', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: 'user-1', passwordHash: null } as never)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

    await expect(upgradeAnonymousAccount('user-1', input)).rejects.toMatchObject({ status: 409 });
  });
});
