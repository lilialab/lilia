import { env } from '@/lib/server/env';
import { getQueue } from '@/lib/server/redis';

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

  await queue.add(
    MEMORY_EXTRACT_JOB_NAME,
    { sessionId, userId } satisfies MemoryExtractJobData,
    {
      jobId: bullJobId,
      delay: delayMs,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  return { bullJobId, delayMs };
}
