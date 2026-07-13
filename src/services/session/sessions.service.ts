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
      status: true,
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

/**
 * 将会话标记为已完结，供记忆整理 Worker 扫描。
 * 幂等：已是 completed 时直接返回，不报错。
 */
export async function completeSession(sessionId: string, userId: string) {
  await assertSessionOwnedByUser(sessionId, userId);

  const session = await prisma.chatSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  if (session.status === 'completed') {
    return { session, alreadyCompleted: true };
  }

  const updated = await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'completed' },
  });

  return { session: updated, alreadyCompleted: false };
}

/**
 * 完结当前用户的默认会话。
 */
export async function completeDefaultSession(userId: string) {
  const session = await getOrCreateDefaultSession(userId);
  return completeSession(session.id, userId);
}
