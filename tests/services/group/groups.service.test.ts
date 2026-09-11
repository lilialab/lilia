import { AppError } from '@/lib/server/app-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    userCharacter: {
      findMany: vi.fn(),
    },
    groupSession: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { createGroup } from '@/services/group/groups.service';
import { API_ERROR_CODE } from '@/types/api-error';

const rinProfile = { name: '凛', shortBio: '嘴毒' };

describe('createGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('允许只含非 lilia 的通讯录成员', async () => {
    vi.mocked(prisma.userCharacter.findMany).mockResolvedValue([
      { characterId: 'char-rin' },
    ] as never);
    vi.mocked(prisma.groupSession.create).mockResolvedValue({
      id: 'g1',
      title: '只有凛',
      createdAt: new Date(),
      updatedAt: new Date(),
      generatingStartedAt: null,
      members: [{ character: { id: 'char-rin', slug: 'rin', profile: rinProfile } }],
    } as never);

    const group = await createGroup('user-1', {
      title: '只有凛',
      characterIds: ['char-rin'],
    });

    expect(group.members).toEqual([
      { id: 'char-rin', slug: 'rin', name: '凛', shortBio: '嘴毒' },
    ]);
    expect(prisma.groupSession.create).toHaveBeenCalledOnce();
  });

  it('有人不在通讯录时拒绝', async () => {
    vi.mocked(prisma.userCharacter.findMany).mockResolvedValue([
      { characterId: 'char-rin' },
    ] as never);

    await expect(
      createGroup('user-1', {
        title: '群',
        characterIds: ['char-rin', 'char-unknown'],
      }),
    ).rejects.toMatchObject({
      status: AppError.badRequest('').status,
      code: API_ERROR_CODE.GROUP_MEMBERS_NOT_CONTACTS,
    });
    expect(prisma.groupSession.create).not.toHaveBeenCalled();
  });
});
