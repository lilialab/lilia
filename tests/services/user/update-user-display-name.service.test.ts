import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { updateUserDisplayName } from '@/services/user/users.service';

describe('updateUserDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('更新 displayName 并返回公开用户字段', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-1',
      username: 'tom',
      displayName: '新昵称',
      locale: 'zh',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    } as never);

    const user = await updateUserDisplayName('user-1', '新昵称');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: '新昵称' },
      select: expect.objectContaining({ displayName: true }),
    });
    expect(user.displayName).toBe('新昵称');
    expect(user.locale).toBe('zh');
  });
});
