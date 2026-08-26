import { AppError } from '@/lib/server/app-error';
import { DEFAULT_CHARACTER_ID } from '@/prompts/load';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
    },
    userCharacter: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    chatSession: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/services/memory/extract-queue.service', () => ({
  cancelMemoryExtract: vi.fn(),
}));

vi.mock('@/services/session/sessions.service', () => ({
  createSession: vi.fn(),
}));

import { prisma } from '@/lib/server/prisma';
import { ensureDefaultContact, removeContact } from '@/services/character/contacts.service';
import { API_ERROR_CODE } from '@/types/api-error';

describe('ensureDefaultContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('默认角色存在时幂等添加并返回 id', async () => {
    vi.mocked(prisma.character.findUnique)
      .mockResolvedValueOnce({ id: 'char-default' } as never)
      .mockResolvedValueOnce({
        id: 'char-default',
        slug: DEFAULT_CHARACTER_ID,
      } as never);
    vi.mocked(prisma.userCharacter.findUnique).mockResolvedValue({
      createdAt: new Date(),
      character: {
        id: 'char-default',
        slug: DEFAULT_CHARACTER_ID,
      },
    } as never);

    await expect(ensureDefaultContact('user-1')).resolves.toBe('char-default');
    expect(prisma.character.findUnique).toHaveBeenCalledWith({
      where: { slug: DEFAULT_CHARACTER_ID },
      select: { id: true },
    });
  });

  it('库中无默认角色时抛 500', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);

    await expect(ensureDefaultContact('user-1')).rejects.toMatchObject({
      status: AppError.internal('').status,
      message: `默认角色 ${DEFAULT_CHARACTER_ID} 不存在，请先执行 seed`,
    });
  });
});

describe('removeContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('拒绝删除默认角色', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      slug: DEFAULT_CHARACTER_ID,
    } as never);

    await expect(removeContact('user-1', 'char-default')).rejects.toMatchObject({
      status: AppError.badRequest('').status,
      message: '不能删除默认好友',
      code: API_ERROR_CODE.CANNOT_DELETE_DEFAULT_CONTACT,
    });
    expect(prisma.userCharacter.findUnique).not.toHaveBeenCalled();
  });
});
