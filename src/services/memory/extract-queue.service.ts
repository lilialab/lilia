import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import { getQueue } from '@/lib/server/redis';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';

export const MEMORY_EXTRACT_QUEUE = 'memory-extract';
export const MEMORY_EXTRACT_JOB_NAME = 'extract';

export type MemoryExtractJobData = {
  sessionId: string;
  userId: string;
};

/** 每会话唯一 jobId，用于滑动窗口重置（BullMQ 禁止自定义 id 含 `:`）。 */
export function memoryExtractJobId(sessionId: string): string {
  return `extract-${sessionId}`;
}

function defaultDelayMs(): number {
  return env.MEMORY_EXTRACT_IDLE_MINUTES * 60 * 1000;
}

/**
 * 调度记忆 extract：同 sessionId 先移除已有 delayed/waiting job 再入队，实现滑动重置。
 * @param delayMs 延迟毫秒；默认取 MEMORY_EXTRACT_IDLE_MINUTES；立即执行传 0
 */
export async function scheduleMemoryExtract(
  sessionId: string,
  userId: string,
  options?: { delayMs?: number },
): Promise<{ bullJobId: string; delayMs: number }> {
  const delayMs = options?.delayMs ?? defaultDelayMs();
  const queue = getQueue(MEMORY_EXTRACT_QUEUE);
  const bullJobId = memoryExtractJobId(sessionId);

  const existing = await queue.getJob(bullJobId);
  if (existing) {
    await existing.remove();
  }

  await queue.add(MEMORY_EXTRACT_JOB_NAME, { sessionId, userId } satisfies MemoryExtractJobData, {
    jobId: bullJobId,
    delay: delayMs,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });

  return { bullJobId, delayMs };
}

/** 取消该会话上挂起的 extract job（若不存在则忽略）。 */
export async function cancelMemoryExtract(sessionId: string): Promise<void> {
  const queue = getQueue(MEMORY_EXTRACT_QUEUE);
  const existing = await queue.getJob(memoryExtractJobId(sessionId));
  if (existing) {
    await existing.remove();
  }
}

/** 列出该用户下仍有未整理消息的会话 id。 */
async function listSessionIdsWithPendingMessages(userId: string): Promise<string[]> {
  const rows = await prisma.message.findMany({
    where: {
      isConsolidated: false,
      session: { userId },
    },
    distinct: ['sessionId'],
    select: { sessionId: true },
  });
  return rows.map((row) => row.sessionId).filter((id): id is string => id != null);
}

export type EnqueuedExtractJob = {
  sessionId: string;
  bullJobId: string;
  delayMs: number;
};

/**
 * 立即入队 extract：指定 session，或该用户全部有未整理消息的会话。
 */
export async function enqueueMemoryExtractJobs(options: {
  userId: string;
  sessionId?: string;
}): Promise<{ jobs: EnqueuedExtractJob[]; queued: true }> {
  const { userId, sessionId } = options;

  if (sessionId) {
    await assertSessionOwnedByUser(sessionId, userId);
    const scheduled = await scheduleMemoryExtract(sessionId, userId, { delayMs: 0 });
    return {
      jobs: [{ sessionId, ...scheduled }],
      queued: true,
    };
  }

  const sessionIds = await listSessionIdsWithPendingMessages(userId);
  if (sessionIds.length === 0) {
    throw AppError.badRequest('没有可整理的未整理消息');
  }

  const jobs: EnqueuedExtractJob[] = [];
  for (const id of sessionIds) {
    const scheduled = await scheduleMemoryExtract(id, userId, { delayMs: 0 });
    jobs.push({ sessionId: id, ...scheduled });
  }

  return { jobs, queued: true };
}
