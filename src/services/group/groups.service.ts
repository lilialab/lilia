import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { DEFAULT_CHARACTER_ID } from '@/prompts/load';

const characterSelect = {
  id: true,
  slug: true,
  displayName: true,
} as const;

const groupDetailSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  members: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      character: { select: characterSelect },
    },
  },
} as const;

export type GroupMemberSummary = {
  id: string;
  slug: string;
  displayName: string;
};

export type GroupDetail = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  members: GroupMemberSummary[];
};

function mapGroupDetail(row: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  members: { character: GroupMemberSummary }[];
}): GroupDetail {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    members: row.members.map((m) => m.character),
  };
}

/** 校验全部 characterId 均在用户通讯录中，且含默认角色 arbor。 */
async function assertGroupMembersValid(userId: string, characterIds: string[]): Promise<void> {
  const contacts = await prisma.userCharacter.findMany({
    where: {
      userId,
      characterId: { in: characterIds },
    },
    select: {
      characterId: true,
      character: { select: { slug: true } },
    },
  });

  const found = new Set(contacts.map((c) => c.characterId));
  const missing = characterIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw AppError.badRequest('请先将所选 AI 添加为好友');
  }

  if (!contacts.some((c) => c.character.slug === DEFAULT_CHARACTER_ID)) {
    throw AppError.badRequest('群聊须包含 arbor');
  }
}

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
 * 成员须已在通讯录中，且必须包含 arbor。
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
