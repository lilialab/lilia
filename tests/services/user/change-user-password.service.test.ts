import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const revokeAllAuthSessionsMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/server/session', () => ({
  revokeAllAuthSessions: revokeAllAuthSessionsMock,
}));

import { hashPassword, verifyPassword } from '@/lib/server/password';
import { prisma } from '@/lib/server/prisma';
import { changeUserPassword } from '@/services/user/users.service';

describe('changeUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hashPassword).mockResolvedValue('new-hash');
    revokeAllAuthSessionsMock.mockResolvedValue(undefined);
  });

  it('当前密码正确时更新哈希并吊销全部会话', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'old-hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await changeUserPassword('user-1', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(hashPassword).toHaveBeenCalledWith('new-password');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'new-hash' },
    });
    expect(revokeAllAuthSessionsMock).toHaveBeenCalledWith('user-1');
  });

  it('当前密码错误时抛 401', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'old-hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      changeUserPassword('user-1', { currentPassword: 'wrong', newPassword: 'new-password' }),
    ).rejects.toMatchObject({
      status: 401,
      code: API_ERROR_CODE.INVALID_CURRENT_PASSWORD,
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(revokeAllAuthSessionsMock).not.toHaveBeenCalled();
  });

  it('新密码与当前相同时抛 400', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'old-hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await expect(
      changeUserPassword('user-1', {
        currentPassword: 'same-password',
        newPassword: 'same-password',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.PASSWORD_UNCHANGED,
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(revokeAllAuthSessionsMock).not.toHaveBeenCalled();
  });
});
