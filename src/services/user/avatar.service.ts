import { AppError } from '@/lib/server/app-error';
import { assertAvatarBytes } from '@/lib/server/avatar';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { deleteS3Object, getS3Object, putS3Object } from '@/lib/server/s3';
import { AVATAR_CONTENT_TYPES, buildAvatarObjectKey } from '@/utils/avatar';
import { type PublicUser, publicUserSelect, toPublicUser } from './users.service';

/** 校验并上传当前用户头像；替换时删除旧对象。 */
export async function uploadUserAvatar(userId: string, bytes: Uint8Array): Promise<PublicUser> {
  const kind = assertAvatarBytes(bytes);

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });
  if (!current) {
    throw AppError.unauthorized('用户不存在');
  }

  const key = buildAvatarObjectKey(`avatars/${userId}`, kind);
  await putS3Object({
    key,
    body: bytes,
    contentType: AVATAR_CONTENT_TYPES[kind],
  });

  const row = await prisma.user.update({
    where: { id: userId },
    data: { avatarKey: key },
    select: publicUserSelect,
  });

  if (current.avatarKey && current.avatarKey !== key) {
    try {
      await deleteS3Object(current.avatarKey);
    } catch (error: unknown) {
      logger.warn({ err: error, key: current.avatarKey }, '删除旧头像对象失败');
    }
  }

  return toPublicUser(row);
}

/** 读取指定用户头像；未上传或不存在时 404。需登录（由 route 校验）。 */
export async function getUserAvatar(
  userId: string,
): Promise<{ body: Uint8Array; contentType: string }> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });
  if (!row) {
    throw AppError.notFound('用户不存在');
  }
  if (!row.avatarKey) {
    throw AppError.notFound('尚未上传头像');
  }

  const object = await getS3Object(row.avatarKey);
  if (!object) {
    throw AppError.notFound('尚未上传头像');
  }
  return object;
}
