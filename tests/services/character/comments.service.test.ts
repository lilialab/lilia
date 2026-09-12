import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
    },
    characterComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import {
  createCharacterComment,
  listCharacterComments,
} from '@/services/character/comments.service';

describe('listCharacterComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('角色不存在时 404', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);

    await expect(listCharacterComments('missing')).rejects.toMatchObject({
      status: AppError.notFound('').status,
    });

    expect(prisma.characterComment.findMany).not.toHaveBeenCalled();
  });

  it('只查楼主未软删，新到旧，join 当前昵称', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: 'char-1' } as never);
    vi.mocked(prisma.characterComment.findMany).mockResolvedValue([
      {
        id: 'c-1',
        body: '好看',
        createdAt: new Date('2026-09-12T00:00:00.000Z'),
        user: { nickname: '小明' },
      },
    ] as never);

    const comments = await listCharacterComments('char-1');

    expect(prisma.characterComment.findMany).toHaveBeenCalledWith({
      where: {
        characterId: 'char-1',
        parentId: null,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { nickname: true } },
      },
    });
    expect(comments).toEqual([
      {
        id: 'c-1',
        body: '好看',
        createdAt: '2026-09-12T00:00:00.000Z',
        nickname: '小明',
      },
    ]);
  });
});

describe('createCharacterComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('角色不存在时 404', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);

    await expect(createCharacterComment('user-1', 'missing', '好看')).rejects.toMatchObject({
      status: AppError.notFound('').status,
    });

    expect(prisma.characterComment.create).not.toHaveBeenCalled();
  });

  it('只写 characterId / userId / body，返回当前昵称', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: 'char-1' } as never);
    vi.mocked(prisma.characterComment.create).mockResolvedValue({
      id: 'c-1',
      body: '好看',
      createdAt: new Date('2026-09-12T00:00:00.000Z'),
      user: { nickname: '小明' },
    } as never);

    const comment = await createCharacterComment('user-1', 'char-1', '好看');

    expect(prisma.characterComment.create).toHaveBeenCalledWith({
      data: { characterId: 'char-1', userId: 'user-1', body: '好看' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { nickname: true } },
      },
    });
    expect(comment).toEqual({
      id: 'c-1',
      body: '好看',
      createdAt: '2026-09-12T00:00:00.000Z',
      nickname: '小明',
    });
  });
});
