import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteMemoriesByUserIdMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/password', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@/services/memory/vector.service', () => ({
  VectorService: vi.fn().mockImplementation(function MockVectorService() {
    return {
      deleteMemoriesByUserId: deleteMemoriesByUserIdMock,
    };
  }),
}));

import { verifyPassword } from '@/lib/server/password';
import { prisma } from '@/lib/server/prisma';
import { deleteUserAccount } from '@/services/user/users.service';

describe('deleteUserAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMemoriesByUserIdMock.mockResolvedValue(undefined);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as never);
  });

  it('密码正确时清理 Chroma 并删除用户', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await deleteUserAccount('user-1', 'password123');

    expect(deleteMemoriesByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('当前密码错误时抛 401', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(deleteUserAccount('user-1', 'wrong')).rejects.toMatchObject({
      status: 401,
      code: API_ERROR_CODE.INVALID_CURRENT_PASSWORD,
    });

    expect(deleteMemoriesByUserIdMock).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
