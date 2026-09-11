import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import {
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { isGenerationBusy } from '@/services/session/generation-lock.utils';
import { API_ERROR_CODE } from '@/types/api-error';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type GroupMemberSummary = CharacterCatalogItem;

export type GroupDetail = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMemberSummary[];
  isGenerating: boolean;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const characterSelect = {
  id: true,
  slug: true,
  profile: true,
} as const;

const groupDetailSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  generatingStartedAt: true,
  members: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      character: { select: characterSelect },
    },
  },
} as const;

function mapGroupDetail(row: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  generatingStartedAt: Date | null;
  members: { character: { id: string; slug: string; profile: unknown } }[];
}): GroupDetail {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    members: row.members.map((m) => toCharacterCatalogItem(m.character)),
    isGenerating: isGenerationBusy(row.generatingStartedAt),
  };
}

/** 校验全部 characterId 均在用户通讯录中（至少 1 个由 schema 保证）。 */
async function assertGroupMembersValid(userId: string, characterIds: string[]): Promise<void> {
  const contacts = await prisma.userCharacter.findMany({
    where: {
      userId,
      characterId: { in: characterIds },
    },
    select: { characterId: true },
  });

  const found = new Set(contacts.map((c) => c.characterId));
  const missing = characterIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw AppError.badRequest(
      '请先将所选 AI 添加为好友',
      API_ERROR_CODE.GROUP_MEMBERS_NOT_CONTACTS,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 校验群归属；不存在或不属于该用户时抛 404。 */
export async function assertGroupOwnedByUser(
  groupSessionId: string,
  userId: string,
): Promise<void> {
  const group = await prisma.groupSession.findFirst({
    where: { id: groupSessionId, userId },
    select: { id: true },
  });

  if (!group) {
    throw AppError.notFound('群聊不存在');
  }
}

/** 获取群详情；不存在或不属于该用户时抛 404。 */
export async function getGroupOrThrow(
  groupSessionId: string,
  userId: string,
): Promise<GroupDetail> {
  const row = await prisma.groupSession.findFirst({
    where: { id: groupSessionId, userId },
    select: groupDetailSelect,
  });

  if (!row) {
    throw AppError.notFound('群聊不存在');
  }

  return mapGroupDetail(row);
}

/** 列出用户的全部群聊（按更新时间降序）。 */
export async function listGroups(userId: string): Promise<GroupDetail[]> {
  const rows = await prisma.groupSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: groupDetailSelect,
  });

  return rows.map(mapGroupDetail);
}

/**
 * 创建群聊（同批成员可建多个群）。
 * 成员须已在通讯录中，至少 1 个 AI。
 */
export async function createGroup(
  userId: string,
  options: { title: string; characterIds: string[] },
): Promise<GroupDetail> {
  const { title, characterIds } = options;
  await assertGroupMembersValid(userId, characterIds);

  const row = await prisma.groupSession.create({
    data: {
      userId,
      title,
      members: {
        create: characterIds.map((characterId) => ({ characterId })),
      },
    },
    select: groupDetailSelect,
  });

  return mapGroupDetail(row);
}

/**
 * 硬删群聊（cascade 成员与消息）；不存在或不属于该用户时抛 404。
 */
export async function deleteGroup(groupSessionId: string, userId: string): Promise<void> {
  await assertGroupOwnedByUser(groupSessionId, userId);
  await prisma.groupSession.delete({ where: { id: groupSessionId } });
}

/**
 * 整表覆盖群成员（须为好友、至少 1 个）；踢人只删 GroupMember，不动消息。
 */
export async function replaceGroupMembers(
  groupSessionId: string,
  userId: string,
  characterIds: string[],
): Promise<GroupDetail> {
  await assertGroupOwnedByUser(groupSessionId, userId);
  await assertGroupMembersValid(userId, characterIds);

  const existing = await prisma.groupMember.findMany({
    where: { groupSessionId },
    select: { characterId: true },
  });
  const existingIds = new Set(existing.map((m) => m.characterId));
  const nextIds = new Set(characterIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = characterIds.filter((id) => !existingIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (toRemove.length > 0) {
      await tx.groupMember.deleteMany({
        where: {
          groupSessionId,
          characterId: { in: toRemove },
        },
      });
    }

    if (toAdd.length > 0) {
      await tx.groupMember.createMany({
        data: toAdd.map((characterId) => ({ groupSessionId, characterId })),
      });
    }

    await tx.groupSession.update({
      where: { id: groupSessionId },
      data: { updatedAt: new Date() },
    });
  });

  return getGroupOrThrow(groupSessionId, userId);
}
