import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
    },
    userCharacter: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    chatSession: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/services/memory/extract-queue.service', () => ({
  cancelMemoryExtract: vi.fn(),
}));

vi.mock('@/services/chat/message.service', () => ({
  softDeleteSessionMessages: vi.fn(),
}));

vi.mock('@/services/session/sessions.service', () => ({
  createSession: vi.fn(),
}));

import { prisma } from '@/lib/server/prisma';
import { addContact, removeContact } from '@/services/character/contacts.service';
import { softDeleteSessionMessages } from '@/services/chat/message.service';
import { cancelMemoryExtract } from '@/services/memory/extract-queue.service';

const listedCharacter = {
  id: 'char-1',
  slug: 'mybot',
  name: '小明',
  shortBio: '',
  avatarKey: null,
  ownerId: 'owner-1',
  isListed: true,
  updatedAt: new Date('2026-09-14T00:00:00.000Z'),
};

describe('addContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('下架且尚未添加时当不存在', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...listedCharacter,
      isListed: false,
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue(null);

    await expect(addContact('user-2', 'char-1')).rejects.toMatchObject({
      status: 404,
    });
    expect(prisma.userCharacter.create).not.toHaveBeenCalled();
  });

  it('下架但已经添加时仍返回通讯录', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      ...listedCharacter,
      isListed: false,
    } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue({
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
      character: { ...listedCharacter, isListed: false },
    } as never);

    await expect(addContact('user-2', 'char-1')).resolves.toMatchObject({
      id: 'char-1',
      createdAt: new Date('2026-09-14T00:00:00.000Z'),
    });
    expect(prisma.userCharacter.create).not.toHaveBeenCalled();
  });
});

describe('removeContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有单聊时取消 extract、软删消息、移除通讯录', async () => {
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue({ id: 'uc-1' } as never);
    vi.mocked(prisma.chatSession.findUnique).mockResolvedValue({ id: 'sess-1' } as never);
    vi.mocked(prisma.userCharacter.delete).mockResolvedValue({} as never);

    await removeContact('user-1', 'char-rin');

    expect(cancelMemoryExtract).toHaveBeenCalledWith('sess-1');
    expect(softDeleteSessionMessages).toHaveBeenCalledWith('sess-1');
    expect(prisma.userCharacter.delete).toHaveBeenCalledWith({
      where: { userId_characterId: { userId: 'user-1', characterId: 'char-rin' } },
    });
  });

  it('无单聊时只移除通讯录', async () => {
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue({ id: 'uc-1' } as never);
    vi.mocked(prisma.chatSession.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userCharacter.delete).mockResolvedValue({} as never);

    await removeContact('user-1', 'char-rin');

    expect(cancelMemoryExtract).not.toHaveBeenCalled();
    expect(softDeleteSessionMessages).not.toHaveBeenCalled();
    expect(prisma.userCharacter.delete).toHaveBeenCalledWith({
      where: { userId_characterId: { userId: 'user-1', characterId: 'char-rin' } },
    });
  });

  it('可以删除 lilia', async () => {
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue({ id: 'uc-1' } as never);
    vi.mocked(prisma.chatSession.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userCharacter.delete).mockResolvedValue({} as never);

    await removeContact('user-1', 'char-lilia');

    expect(prisma.userCharacter.delete).toHaveBeenCalledWith({
      where: { userId_characterId: { userId: 'user-1', characterId: 'char-lilia' } },
    });
  });
});
