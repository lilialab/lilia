import { beforeEach, describe, expect, it, vi } from 'vitest';

const getS3ObjectMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/s3', () => ({
  getS3Object: getS3ObjectMock,
}));

import { prisma } from '@/lib/server/prisma';
import { getCharacterAvatar } from '@/services/character/avatar.service';

const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);

describe('getCharacterAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('角色不存在 404', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);

    await expect(getCharacterAvatar('missing')).rejects.toMatchObject({
      status: 404,
    });
    expect(getS3ObjectMock).not.toHaveBeenCalled();
  });

  it('未设置头像 404', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ avatarKey: null } as never);

    await expect(getCharacterAvatar('char-1')).rejects.toMatchObject({
      status: 404,
    });
    expect(getS3ObjectMock).not.toHaveBeenCalled();
  });

  it('有 key 时返回对象', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      avatarKey: 'characters/char-1/a.jpg',
    } as never);
    getS3ObjectMock.mockResolvedValue({
      body: jpegBytes,
      contentType: 'image/jpeg',
    });

    await expect(getCharacterAvatar('char-1')).resolves.toEqual({
      body: jpegBytes,
      contentType: 'image/jpeg',
    });
  });
});
