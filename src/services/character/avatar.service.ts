import { AppError } from '@/lib/server/app-error';
import { assertAvatarBytes } from '@/lib/server/avatar';
import { prisma } from '@/lib/server/prisma';
import { getS3Object, putS3Object } from '@/lib/server/s3';
import { AVATAR_CONTENT_TYPES, buildAvatarObjectKey } from '@/utils/avatar';
import {
  assertCharacterActive,
  assertCharacterOwner,
  catalogCharacterSelect,
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from './definition.utils';

/** 创建者写入角色头像并返回目录项。 */
export async function saveCharacterAvatar(
  userId: string,
  characterId: string,
  bytes: Uint8Array,
): Promise<CharacterCatalogItem> {
  const existing = await prisma.character.findUnique({
    where: { id: characterId },
    select: { ownerId: true, deletedAt: true },
  });
  assertCharacterActive(existing);
  assertCharacterOwner(existing.ownerId, userId);

  const kind = assertAvatarBytes(bytes);
  const key = buildAvatarObjectKey(`avatars/characters/${characterId}`, kind);
  await putS3Object({
    key,
    body: bytes,
    contentType: AVATAR_CONTENT_TYPES[kind],
  });

  const row = await prisma.character.update({
    where: { id: characterId },
    data: { avatarKey: key },
    select: catalogCharacterSelect,
  });
  return toCharacterCatalogItem(row);
}

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
