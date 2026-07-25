import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { generationLockStaleBefore } from './generation-lock.utils';

/**
 * 抢占单聊生成锁；失败抛 409。
 * @returns 本次占用时间戳，释放时须原样传入
 */
export async function claimChatGeneration(sessionId: string): Promise<Date> {
  const now = new Date();
  const result = await prisma.chatSession.updateMany({
    where: {
      id: sessionId,
      OR: [
        { generatingStartedAt: null },
        { generatingStartedAt: { lt: generationLockStaleBefore(now.getTime()) } },
      ],
    },
    data: { generatingStartedAt: now },
  });

  if (result.count === 0) {
    throw AppError.conflict('对方正在回复，请稍后再发');
  }

  return now;
}

/** 释放单聊生成锁（仅当占用时间仍匹配时）。 */
export async function releaseChatGeneration(
  sessionId: string,
  claimedAt: Date,
): Promise<void> {
  await prisma.chatSession.updateMany({
    where: { id: sessionId, generatingStartedAt: claimedAt },
    data: { generatingStartedAt: null },
  });
}

/** 无条件清空单聊生成锁（清空聊天等场景）。 */
export async function clearChatGeneration(sessionId: string): Promise<void> {
  await prisma.chatSession.updateMany({
    where: { id: sessionId },
    data: { generatingStartedAt: null },
  });
}
