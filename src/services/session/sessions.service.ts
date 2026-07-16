import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';

/**
 * 创建新的聊天会话（一人一角一线由调用方保证或依赖唯一约束）
 * @param userId 所属用户 ID
 * @param characterId 角色 UUID
 * @param title 可选，默认「新对话」
 */
export async function createSession(userId: string, characterId: string, title?: string) {
  return prisma.chatSession.create({
    data: {
      userId,
      characterId,
      title: title?.trim() || '新对话',
    },
  });
}

/** 列出用户的全部会话（按创建时间降序）。 */
export async function listSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      characterId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** 校验会话归属；不存在或不属于该用户时抛 404。 */
export async function assertSessionOwnedByUser(sessionId: string, userId: string): Promise<void> {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!session) {
    throw AppError.notFound('会话不存在');
  }
}
