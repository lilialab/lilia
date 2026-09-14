import { AppError } from '@/lib/server/app-error';
import { assertAvatarBytes } from '@/lib/server/avatar';
import { prisma } from '@/lib/server/prisma';
import { getS3Object, putS3Object } from '@/lib/server/s3';
import {
  catalogCharacterSelect,
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { AVATAR_CONTENT_TYPES, buildAvatarObjectKey } from '@/utils/avatar';

/** 写入角色头像并返回目录项。 */
export async function saveCharacterAvatar(
  characterId: string,
  bytes: Uint8Array,
): Promise<CharacterCatalogItem> {
  const kind = assertAvatarBytes(bytes);
  const existing = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true },
  });
  if (!existing) {
    throw AppError.notFound('角色不存在');
  }

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
