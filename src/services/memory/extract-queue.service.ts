import { env } from '@/lib/server/env';
import { getQueue } from '@/lib/server/redis';

export const MEMORY_EXTRACT_QUEUE = 'memory-extract';
export const MEMORY_EXTRACT_JOB_NAME = 'extract';

export type MemoryExtractJobData =
  | { userId: string; sessionId: string; groupSessionId?: undefined }
  | { userId: string; groupSessionId: string; sessionId?: undefined };

/** 每会话唯一 jobId，用于滑动窗口重置（BullMQ 禁止自定义 id 含 `:`）。 */
export function memoryExtractJobId(sessionId: string): string {
  return `extract-${sessionId}`;
}

/** 每群唯一 jobId，用于滑动窗口重置。 */
export function memoryExtractGroupJobId(groupSessionId: string): string {
  return `extract-group-${groupSessionId}`;
}

function defaultDelayMs(): number {
  return env.MEMORY_EXTRACT_IDLE_MINUTES * 60 * 1000;
}

async function enqueueExtract(
  bullJobId: string,
  data: MemoryExtractJobData,
  delayMs: number,
): Promise<{ bullJobId: string; delayMs: number }> {
  const queue = getQueue(MEMORY_EXTRACT_QUEUE);
  const existing = await queue.getJob(bullJobId);
  if (existing) {
    await existing.remove();
  }

  await queue.add(MEMORY_EXTRACT_JOB_NAME, data, {
    jobId: bullJobId,
    delay: delayMs,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });

  return { bullJobId, delayMs };
}

/**
 * 调度单聊记忆 extract：同 sessionId 先移除已有 delayed/waiting job 再入队，实现滑动重置。
 * @param delayMs 延迟毫秒；默认取 MEMORY_EXTRACT_IDLE_MINUTES；立即执行传 0
 */
export async function scheduleMemoryExtract(
  sessionId: string,
  userId: string,
  options?: { delayMs?: number },
): Promise<{ bullJobId: string; delayMs: number }> {
  const delayMs = options?.delayMs ?? defaultDelayMs();
  return enqueueExtract(
    memoryExtractJobId(sessionId),
    { sessionId, userId },
    delayMs,
  );
}

/**
 * 调度群聊记忆 extract：同 groupSessionId 滑动重置；不调度 maintain。
 */
export async function scheduleGroupMemoryExtract(
  groupSessionId: string,
  userId: string,
  options?: { delayMs?: number },
): Promise<{ bullJobId: string; delayMs: number }> {
  const delayMs = options?.delayMs ?? defaultDelayMs();
  return enqueueExtract(
    memoryExtractGroupJobId(groupSessionId),
    { groupSessionId, userId },
    delayMs,
  );
}

/** 取消该会话上挂起的 extract job（若不存在则忽略）。 */
export async function cancelMemoryExtract(sessionId: string): Promise<void> {
  const queue = getQueue(MEMORY_EXTRACT_QUEUE);
  const existing = await queue.getJob(memoryExtractJobId(sessionId));
  if (existing) {
    await existing.remove();
  }
}

/** 取消该群上挂起的 extract job（若不存在则忽略）。 */
export async function cancelGroupMemoryExtract(groupSessionId: string): Promise<void> {
  const queue = getQueue(MEMORY_EXTRACT_QUEUE);
  const existing = await queue.getJob(memoryExtractGroupJobId(groupSessionId));
  if (existing) {
    await existing.remove();
  }
}
