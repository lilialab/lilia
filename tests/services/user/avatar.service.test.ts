import { API_ERROR_CODE } from '@/types/api-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const putS3ObjectMock = vi.hoisted(() => vi.fn());
const getS3ObjectMock = vi.hoisted(() => vi.fn());
const deleteS3ObjectMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/server/s3', () => ({
  putS3Object: putS3ObjectMock,
  getS3Object: getS3ObjectMock,
  deleteS3Object: deleteS3ObjectMock,
}));

vi.mock('@/lib/server/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { prisma } from '@/lib/server/prisma';
import { getUserAvatar, uploadUserAvatar } from '@/services/user/avatar.service';
import { AVATAR_MAX_BYTES } from '@/services/user/avatar.utils';

const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);

const publicRow = {
  id: 'user-1',
  username: 'tom',
  nickname: '小明',
  avatarKey: 'avatars/user-1/new.jpg',
  locale: 'zh',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

describe('uploadUserAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    putS3ObjectMock.mockResolvedValue(undefined);
    deleteS3ObjectMock.mockResolvedValue(undefined);
    vi.mocked(prisma.user.update).mockResolvedValue(publicRow as never);
  });

  it('空内容 400', async () => {
    await expect(uploadUserAvatar('user-1', new Uint8Array())).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.AVATAR_REQUIRED,
    });
    expect(putS3ObjectMock).not.toHaveBeenCalled();
  });

  it('超过 5MB 400', async () => {
    const tooLarge = new Uint8Array(AVATAR_MAX_BYTES + 1);
    tooLarge[0] = 0xff;
    tooLarge[1] = 0xd8;
    tooLarge[2] = 0xff;

    await expect(uploadUserAvatar('user-1', tooLarge)).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.AVATAR_TOO_LARGE,
    });
    expect(putS3ObjectMock).not.toHaveBeenCalled();
  });

  it('非 jpeg/png/webp 400', async () => {
    await expect(
      uploadUserAvatar('user-1', Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])),
    ).rejects.toMatchObject({
      status: 400,
      code: API_ERROR_CODE.AVATAR_INVALID_TYPE,
    });
    expect(putS3ObjectMock).not.toHaveBeenCalled();
  });

  it('首次上传写入对象并返回 hasAvatar', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ avatarKey: null } as never);

    const user = await uploadUserAvatar('user-1', jpegBytes);

    expect(putS3ObjectMock).toHaveBeenCalledWith({
      key: expect.stringMatching(/^avatars\/user-1\/.+\.jpg$/),
      body: jpegBytes,
      contentType: 'image/jpeg',
    });
    expect(deleteS3ObjectMock).not.toHaveBeenCalled();
    expect(user.hasAvatar).toBe(true);
    expect(user.nickname).toBe('小明');
  });

  it('替换时删除旧对象', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      avatarKey: 'avatars/user-1/old.jpg',
    } as never);

    await uploadUserAvatar('user-1', jpegBytes);

    expect(deleteS3ObjectMock).toHaveBeenCalledWith('avatars/user-1/old.jpg');
  });
});

describe('getUserAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未上传 404', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ avatarKey: null } as never);

    await expect(getUserAvatar('user-1')).rejects.toMatchObject({
      status: 404,
    });
    expect(getS3ObjectMock).not.toHaveBeenCalled();
  });

  it('用户不存在 404', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(getUserAvatar('missing')).rejects.toMatchObject({
      status: 404,
    });
    expect(getS3ObjectMock).not.toHaveBeenCalled();
  });

  it('有 key 时返回对象', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      avatarKey: 'avatars/user-1/new.jpg',
    } as never);
    getS3ObjectMock.mockResolvedValue({
      body: jpegBytes,
      contentType: 'image/jpeg',
    });

    await expect(getUserAvatar('user-1')).resolves.toEqual({
      body: jpegBytes,
      contentType: 'image/jpeg',
    });
  });
});
