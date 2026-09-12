import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';

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
} as const;

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  user: { id: string; nickname: string; avatarKey: string | null; updatedAt: Date };
};

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

async function assertCharacterExists(characterId: string): Promise<void> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true },
  });
  if (!character) {
    throw AppError.notFound('角色不存在');
  }
}

/** 列出角色详情评论：仅楼主、未软删，新到旧；作者信息 join 当前用户。 */
export async function listCharacterComments(characterId: string): Promise<CharacterCommentItem[]> {
  await assertCharacterExists(characterId);

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
  await assertCharacterExists(characterId);

  const row = await prisma.characterComment.create({
    data: { characterId, userId, body },
    select: commentSelect,
  });

  return toCommentItem(row);
}
