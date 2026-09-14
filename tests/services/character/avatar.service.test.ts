import { beforeEach, describe, expect, it, vi } from 'vitest';

const getS3ObjectMock = vi.hoisted(() => vi.fn());
const putS3ObjectMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/s3', () => ({
  getS3Object: getS3ObjectMock,
  putS3Object: putS3ObjectMock,
}));

import { prisma } from '@/lib/server/prisma';
import { getCharacterAvatar, saveCharacterAvatar } from '@/services/character/avatar.service';
import { API_ERROR_CODE } from '@/types/api-error';

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

describe('saveCharacterAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    putS3ObjectMock.mockResolvedValue(undefined);
  });

  it('非法格式 400', async () => {
    await expect(saveCharacterAvatar('char-1', Uint8Array.from([0x00]))).rejects.toMatchObject({
      code: API_ERROR_CODE.AVATAR_INVALID_TYPE,
    });
    expect(putS3ObjectMock).not.toHaveBeenCalled();
  });

  it('角色不存在 404', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);

    await expect(saveCharacterAvatar('missing', jpegBytes)).rejects.toMatchObject({
      status: 404,
    });
    expect(putS3ObjectMock).not.toHaveBeenCalled();
  });

  it('写入对象并更新 avatarKey', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: 'char-1' } as never);
    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      slug: 'mybot',
      name: '小明',
      shortBio: '',
      avatarKey: 'avatars/characters/char-1/a.jpg',
      updatedAt: new Date('2026-09-14T00:00:00.000Z'),
    } as never);

    const item = await saveCharacterAvatar('char-1', jpegBytes);

    expect(putS3ObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/jpeg', body: jpegBytes }),
    );
    expect(item.hasAvatar).toBe(true);
  });
});
