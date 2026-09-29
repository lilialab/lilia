import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { updateUserNickname } from '@/services/user/users.service';

describe('updateUserNickname', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('更新 nickname 并返回公开用户字段', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-1',
      account: 'tom',
      nickname: '新昵称',
      avatarKey: null,
      locale: 'zh',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    } as never);

    const user = await updateUserNickname('user-1', '新昵称');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { nickname: '新昵称' },
      select: expect.objectContaining({ nickname: true }),
    });
    expect(user.nickname).toBe('新昵称');
    expect(user.hasAvatar).toBe(false);
    expect(user.locale).toBe('zh');
  });
});
