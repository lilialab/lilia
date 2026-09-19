import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/server/prisma';
import { isOfficialCharacter } from '@/services/character/official.service';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'official-1' } as never);
});

describe('isOfficialCharacter', () => {
  it('无主角色不算官方，且不查库', async () => {
    await expect(isOfficialCharacter(null)).resolves.toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('官方账号拥有的是官方角色', async () => {
    await expect(isOfficialCharacter('official-1')).resolves.toBe(true);
  });

  it('其它用户拥有的不是官方角色', async () => {
    await expect(isOfficialCharacter('user-1')).resolves.toBe(false);
  });
});
