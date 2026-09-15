import type { Prisma } from '@/generated/prisma/client';
import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { isExploreVisible } from './definition.utils';

export type CharacterCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  nickname: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
};

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  user: { select: { id: true, nickname: true, avatarKey: true, updatedAt: true } },
} satisfies Prisma.CharacterCommentSelect;

type CommentRow = Prisma.CharacterCommentGetPayload<{
  select: typeof commentSelect;
}>;

function toCommentItem(row: CommentRow): CharacterCommentItem {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    userId: row.user.id,
    nickname: row.user.nickname,
    hasAvatar: Boolean(row.user.avatarKey),
    avatarUpdatedAt: row.user.updatedAt.toISOString(),
  };
}

async function assertExploreReadable(userId: string, characterId: string): Promise<void> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { isListed: true, ownerId: true },
  });
  if (!character || !isExploreVisible(character.isListed, character.ownerId, userId)) {
    throw AppError.notFound('角色不存在');
  }
}

/** 列出角色详情评论：仅楼主、未软删，新到旧；作者信息 join 当前用户。 */
export async function listCharacterComments(
  userId: string,
  characterId: string,
): Promise<CharacterCommentItem[]> {
  await assertExploreReadable(userId, characterId);

  const rows = await prisma.characterComment.findMany({
    where: {
      characterId,
      parentId: null,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: commentSelect,
  });

  return rows.map(toCommentItem);
}

/** 发表角色详情评论（楼主；不写 parentId / deletedAt）。 */
export async function createCharacterComment(
  userId: string,
  characterId: string,
  body: string,
): Promise<CharacterCommentItem> {
  await assertExploreReadable(userId, characterId);

  const row = await prisma.characterComment.create({
    data: { characterId, userId, body },
    select: commentSelect,
  });

  return toCommentItem(row);
}
