import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { listGuestCharacters } from '@/services/guest/catalog.service';

const catalogRow = {
  id: 'char-1',
  slug: 'mybot',
  name: '小明',
  shortBio: '',
  avatarKey: null,
  ownerId: 'user-1',
  deletedAt: null,
  updatedAt: new Date('2026-09-14T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'official-1' } as never);
});

describe('listGuestCharacters', () => {
  it('只返回未软删角色，含 isOfficial，无通讯录字段', async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      catalogRow,
      { ...catalogRow, id: 'seed-1', slug: 'lilia', ownerId: 'official-1' },
    ] as never);

    await expect(listGuestCharacters()).resolves.toEqual([
      {
        id: 'char-1',
        slug: 'mybot',
        name: '小明',
        shortBio: '',
        hasAvatar: false,
        avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
        isOfficial: false,
      },
      {
        id: 'seed-1',
        slug: 'lilia',
        name: '小明',
        shortBio: '',
        hasAvatar: false,
        avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
        isOfficial: true,
      },
    ]);
    expect(prisma.character.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      select: expect.any(Object),
      orderBy: { createdAt: 'asc' },
    });
  });
});
