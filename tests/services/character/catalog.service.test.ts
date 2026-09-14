import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    userCharacter: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { getCatalogCharacter, listCharacters } from '@/services/character/catalog.service';

const catalogRow = {
  id: 'char-1',
  slug: 'mybot',
  name: '小明',
  shortBio: '',
  avatarKey: null,
  ownerId: 'user-1',
  updatedAt: new Date('2026-09-14T00:00:00.000Z'),
};

describe('listCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('标记是否通讯录与是否创建者', async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      catalogRow,
      { ...catalogRow, id: 'seed-1', slug: 'lilia', ownerId: null },
    ] as never);
    vi.mocked(prisma.userCharacter.findMany).mockResolvedValue(
      [{ characterId: 'seed-1' }] as never,
    );

    await expect(listCharacters('user-1')).resolves.toEqual([
      {
        id: 'char-1',
        slug: 'mybot',
        name: '小明',
        shortBio: '',
        hasAvatar: false,
        avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
        isContact: false,
        isOwner: true,
      },
      {
        id: 'seed-1',
        slug: 'lilia',
        name: '小明',
        shortBio: '',
        hasAvatar: false,
        avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
        isContact: true,
        isOwner: false,
      },
    ]);
  });
});

describe('getCatalogCharacter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('创建者 isOwner 为 true', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      profile: { identity: { name: '{{name}}', gender: 'female' } },
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue(null);

    await expect(getCatalogCharacter('user-1', 'char-1')).resolves.toMatchObject({
      isOwner: true,
      isContact: false,
      gender: 'female',
    });
  });

  it('非创建者与无主角色 isOwner 为 false', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      ownerId: null,
      profile: { identity: { name: '{{name}}', gender: 'male' } },
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue({ id: 'uc-1' } as never);

    await expect(getCatalogCharacter('user-2', 'char-1')).resolves.toMatchObject({
      isOwner: false,
      isContact: true,
    });
  });

  it('带上可编辑人设字段', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      profile: {
        identity: {
          name: '{{name}}',
          gender: 'female',
          height: '160',
          relation: '朋友',
        },
        personality: ['话少'],
      },
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue(null);

    await expect(getCatalogCharacter('user-1', 'char-1')).resolves.toMatchObject({
      gender: 'female',
      height: '160',
      relation: '朋友',
      personality: ['话少'],
    });
  });
});
