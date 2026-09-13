import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { getS3Object } from '@/lib/server/s3';

/** 读取指定角色头像；未设置或不存在时 404。需登录（由 route 校验）。 */
export async function getCharacterAvatar(
  characterId: string,
): Promise<{ body: Uint8Array; contentType: string }> {
  const row = await prisma.character.findUnique({
    where: { id: characterId },
    select: { avatarKey: true },
  });
  if (!row) {
    throw AppError.notFound('角色不存在');
  }
  if (!row.avatarKey) {
    throw AppError.notFound('尚未设置头像');
  }

  const object = await getS3Object(row.avatarKey);
  if (!object) {
    throw AppError.notFound('尚未设置头像');
  }
  return object;
}
