import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { API_ERROR_CODE } from '@/types/api-error';
import { generationLockStaleBefore } from './generation-lock.utils';

function claimWhere(id: string, now: Date) {
  return {
    id,
    OR: [
      { generatingStartedAt: null },
      { generatingStartedAt: { lt: generationLockStaleBefore(now.getTime()) } },
    ],
  };
}

function assertClaimed(count: number, now: Date, conflictMessage: string): Date {
  if (count === 0) {
    throw AppError.conflict(conflictMessage, API_ERROR_CODE.GENERATION_BUSY);
  }
  return now;
}

/**
 * 抢占单聊生成锁；失败抛 409。
 * @returns 本次占用时间戳，释放时须原样传入
 */
export async function claimChatGeneration(sessionId: string): Promise<Date> {
  const now = new Date();
  const result = await prisma.chatSession.updateMany({
    where: claimWhere(sessionId, now),
    data: { generatingStartedAt: now },
  });
  return assertClaimed(result.count, now, '对方正在回复，请稍后再发');
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

/**
 * 抢占群聊生成锁；失败抛 409。
 * @returns 本次占用时间戳，释放时须原样传入
 */
export async function claimGroupGeneration(groupSessionId: string): Promise<Date> {
  const now = new Date();
  const result = await prisma.groupSession.updateMany({
    where: claimWhere(groupSessionId, now),
    data: { generatingStartedAt: now },
  });
  return assertClaimed(result.count, now, '群内正在回复，请稍后再发');
}

/** 释放群聊生成锁（仅当占用时间仍匹配时）。 */
export async function releaseGroupGeneration(
  groupSessionId: string,
  claimedAt: Date,
): Promise<void> {
  await prisma.groupSession.updateMany({
    where: { id: groupSessionId, generatingStartedAt: claimedAt },
    data: { generatingStartedAt: null },
  });
}

/** 无条件清空群聊生成锁（删群等场景）。 */
export async function clearGroupGeneration(groupSessionId: string): Promise<void> {
  await prisma.groupSession.updateMany({
    where: { id: groupSessionId },
    data: { generatingStartedAt: null },
  });
}
