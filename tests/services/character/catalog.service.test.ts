import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    userCharacter: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import {
  getCatalogCharacter,
  listCharacters,
  setCharacterListed,
} from '@/services/character/catalog.service';
import { API_ERROR_CODE } from '@/types/api-error';

const catalogRow = {
  id: 'char-1',
  slug: 'mybot',
  name: '小明',
  shortBio: '',
  avatarKey: null,
  ownerId: 'user-1',
  isListed: true,
  updatedAt: new Date('2026-09-14T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'official-1' } as never);
});

describe('listCharacters', () => {
  it('只查已上架或自己的角色，并标记通讯录与创建者', async () => {
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
        isListed: true,
        isContact: false,
        isOwner: true,
        isOfficial: false,
      },
      {
        id: 'seed-1',
        slug: 'lilia',
        name: '小明',
        shortBio: '',
        hasAvatar: false,
        avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
        isListed: true,
        isContact: true,
        isOwner: false,
        isOfficial: false,
      },
    ]);
    expect(prisma.character.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ isListed: true }, { ownerId: 'user-1' }],
      },
      select: expect.any(Object),
      orderBy: { createdAt: 'asc' },
    });
  });

  it('官方账号创建的角色 isOfficial 为 true', async () => {
    vi.mocked(prisma.character.findMany).mockResolvedValue([
      { ...catalogRow, ownerId: 'official-1' },
    ] as never);
    vi.mocked(prisma.userCharacter.findMany).mockResolvedValue([]);

    await expect(listCharacters('user-1')).resolves.toMatchObject([
      { id: 'char-1', isOfficial: true, isOwner: false },
    ]);
  });
});

describe('getCatalogCharacter', () => {
  it('创建者 isOwner 为 true', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      profile: { identity: { name: '{{name}}', gender: 'female' } },
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue(null);

    await expect(getCatalogCharacter('user-1', 'char-1')).resolves.toMatchObject({
      isOwner: true,
      isContact: false,
      isListed: true,
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
      isOfficial: false,
    });
  });

  it('带上可编辑人设字段', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      profile: {
        identity: {
          name: '{{name}}',
          gender: 'female',
          age: '17',
          height: '160',
          occupation: '学生',
          relation: '朋友',
        },
        personality: ['话少'],
      },
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue(null);

    await expect(getCatalogCharacter('user-1', 'char-1')).resolves.toMatchObject({
      gender: 'female',
      age: '17',
      height: '160',
      occupation: '学生',
      relation: '朋友',
      personality: ['话少'],
      attitude: undefined,
      values: undefined,
      dislikes: undefined,
    });
  });

  it('下架且非创建者当不存在', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      isListed: false,
      profile: { identity: { name: '{{name}}', gender: 'female' } },
    } as never);

    await expect(getCatalogCharacter('user-2', 'char-1')).rejects.toMatchObject({
      status: 404,
    });
    expect(prisma.userCharacter.findUnique).not.toHaveBeenCalled();
  });

  it('下架后创建者仍可读', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...catalogRow,
      isListed: false,
      profile: { identity: { name: '{{name}}', gender: 'female' } },
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue(null);

    await expect(getCatalogCharacter('user-1', 'char-1')).resolves.toMatchObject({
      isListed: false,
      isOwner: true,
    });
  });
});

describe('setCharacterListed', () => {
  it('非创建者 403', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ ownerId: 'other' } as never);

    await expect(setCharacterListed('user-1', 'char-1', false)).rejects.toMatchObject({
      status: 403,
      code: API_ERROR_CODE.CHARACTER_NOT_OWNER,
    });
    expect(prisma.character.update).not.toHaveBeenCalled();
  });

  it('创建者可下架', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ ownerId: 'user-1' } as never);
    vi.mocked(prisma.character.update).mockResolvedValue({
      ...catalogRow,
      isListed: false,
    } as never);

    await expect(setCharacterListed('user-1', 'char-1', false)).resolves.toMatchObject({
      isListed: false,
      isOwner: true,
    });
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char-1' },
      data: { isListed: false },
      select: expect.any(Object),
    });
  });
});
