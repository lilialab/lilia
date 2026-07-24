import { env } from '@/lib/server/env';
import { getQueue } from '@/lib/server/redis';

export const MEMORY_MAINTAIN_QUEUE = 'memory-maintain';
export const MEMORY_MAINTAIN_PIPELINE_JOB = 'pipeline';

export type MemoryMaintainPipelineJobData = {
  userId: string;
  characterId: string;
};

/** 每用户×角色 pipeline jobId（禁止含 `:`）。 */
export function maintainPipelineJobId(userId: string, characterId: string): string {
  return `maintain-pipeline-${userId}-${characterId}`;
}

function defaultIdleDelayMs(): number {
  return env.MEMORY_MAINTAIN_IDLE_HOURS * 60 * 60 * 1000;
}

/**
 * 为指定用户×角色调度 maintain→profile pipeline；同二元组先移除再入队，实现滑动重置。
 * @param delayMs 默认 MEMORY_MAINTAIN_IDLE_HOURS
 */
export async function scheduleMaintainPipeline(
  userId: string,
  characterId: string,
  options?: { delayMs?: number },
): Promise<{ bullJobId: string; delayMs: number }> {
  const delayMs = options?.delayMs ?? defaultIdleDelayMs();
  const queue = getQueue(MEMORY_MAINTAIN_QUEUE);
  const bullJobId = maintainPipelineJobId(userId, characterId);

  const existing = await queue.getJob(bullJobId);
  if (existing) {
    await existing.remove();
  }

  await queue.add(
    MEMORY_MAINTAIN_PIPELINE_JOB,
    { userId, characterId } satisfies MemoryMaintainPipelineJobData,
    {
      jobId: bullJobId,
      delay: delayMs,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  return { bullJobId, delayMs };
}
