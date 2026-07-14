import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';

/**
 * 创建新的聊天会话
 * @param userId 所属用户 ID
 * @param title 可选，默认"新对话"
 */
export async function createSession(userId: string, title?: string) {
  return prisma.chatSession.create({
    data: {
      userId,
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
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * 获取或创建用户唯一的默认会话（单一信息流）
 */
export async function getOrCreateDefaultSession(userId: string) {
  const existing = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) return existing;

  return createSession(userId, 'pai-arbor');
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
