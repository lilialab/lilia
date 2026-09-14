import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { createCharacter } from '@/services/character/create.service';
import { API_ERROR_CODE } from '@/types/api-error';

describe('createCharacter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('slug 已存在时抛 CHARACTER_SLUG_TAKEN', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: 'c1' } as never);

    await expect(
      createCharacter('user-1', { slug: 'lilia', name: '莉莉娅', gender: 'female' }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.CHARACTER_SLUG_TAKEN,
    });
    expect(prisma.character.create).not.toHaveBeenCalled();
  });

  it('写入 identity.name 占位、空简介与空 skills', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue({
      id: 'c-new',
      slug: 'mybot',
      name: '小明',
      shortBio: '',
      avatarKey: null,
      ownerId: 'user-1',
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
    } as never);

    const character = await createCharacter('user-1', {
      slug: 'mybot',
      name: '小明',
      gender: 'female',
    });

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          slug: 'mybot',
          name: '小明',
          shortBio: '',
          ownerId: 'user-1',
          profile: { identity: { name: '{{name}}', gender: 'female' } },
          skills: [],
          extract: expect.any(String),
        },
      }),
    );
    expect(character).toEqual({
      id: 'c-new',
      slug: 'mybot',
      name: '小明',
      shortBio: '',
      hasAvatar: false,
      avatarUpdatedAt: '2026-09-14T00:00:00.000Z',
    });
  });

  it('选填写入 shortBio 与 identity / personality', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.character.create).mockResolvedValue({
      id: 'c-new',
      slug: 'mybot',
      name: '小明',
      shortBio: '短句',
      avatarKey: null,
      ownerId: 'user-1',
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
    } as never);

    await createCharacter('user-1', {
      slug: 'mybot',
      name: '小明',
      shortBio: '短句',
      gender: 'female',
      height: '147',
      relation: '朋友',
      personality: ['话短'],
    });

    expect(prisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shortBio: '短句',
          profile: {
            identity: { name: '{{name}}', gender: 'female', height: '147', relation: '朋友' },
            personality: ['话短'],
          },
        }),
      }),
    );
  });
});
