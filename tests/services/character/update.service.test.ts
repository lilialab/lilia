import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { updateCharacter } from '@/services/character/update.service';
import { API_ERROR_CODE } from '@/types/api-error';

const catalogRow = {
  id: 'char-1',
  slug: 'mybot',
  name: '新名',
  shortBio: '新简介',
  avatarKey: null,
  ownerId: 'user-1',
  updatedAt: new Date('2026-09-14T00:00:00.000Z'),
};

describe('updateCharacter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('角色不存在 404', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);

    await expect(
      updateCharacter('user-1', 'missing', { name: '小明', gender: 'female' }),
    ).rejects.toMatchObject({
      status: 404,
    });
    expect(prisma.character.update).not.toHaveBeenCalled();
  });

  it('非创建者 403', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ ownerId: 'other' } as never);

    await expect(
      updateCharacter('user-1', 'char-1', { name: '小明', gender: 'female' }),
    ).rejects.toMatchObject({
      status: 403,
      code: API_ERROR_CODE.CHARACTER_NOT_OWNER,
    });
    expect(prisma.character.update).not.toHaveBeenCalled();
  });

  it('无主角色 403', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ ownerId: null } as never);

    await expect(
      updateCharacter('user-1', 'char-1', { name: '小明', gender: 'female' }),
    ).rejects.toMatchObject({
      status: 403,
      code: API_ERROR_CODE.CHARACTER_NOT_OWNER,
    });
    expect(prisma.character.update).not.toHaveBeenCalled();
  });

  it('创建者更新姓名与人设，不改 slug', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ ownerId: 'user-1' } as never);
    vi.mocked(prisma.character.update).mockResolvedValue(catalogRow as never);

    const character = await updateCharacter('user-1', 'char-1', {
      name: '新名',
      shortBio: '新简介',
      gender: 'male',
      height: '170',
      relation: '同事',
      personality: ['稳'],
    });

    expect(prisma.character.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'char-1' },
        data: {
          name: '新名',
          shortBio: '新简介',
          profile: {
            identity: {
              name: '{{name}}',
              gender: 'male',
              height: '170',
              relation: '同事',
            },
            personality: ['稳'],
          },
        },
      }),
    );
    expect(character).toEqual({
      id: 'char-1',
      slug: 'mybot',
      name: '新名',
      shortBio: '新简介',
      hasAvatar: false,
      avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
    });
  });
});
