import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { getQueue } from '@/lib/server/redis';
import { getLastMemoryPipelineAt } from './maintain-pipeline.service';

export const MEMORY_MAINTAIN_QUEUE = 'memory-maintain';
export const MEMORY_MAINTAIN_PIPELINE_JOB = 'pipeline';

export type MemoryMaintainPipelineJobData = {
  userId: string;
  characterId: string;
};

/** 每用户×角色唯一 jobId，用于滑动窗口去重。同二元组的新消息会移除旧 job 重新入队，重置倒计时。 */
export function maintainPipelineJobId(userId: string, characterId: string): string {
  return `maintain-pipeline-${userId}-${characterId}`;
}

/**
 * 闲置等待：用户停止聊天后需要安静多久，管线才触发。
 * 这样做的目的是避免用户还在聊天时管线在后台执行，消耗资源。
 */
function idleDelayMs(): number {
  return env.MEMORY_MAINTAIN_IDLE_HOURS * 60 * 60 * 1000;
}

/**
 * 最小间隔：距上次管线完成至少间隔多久，才能再次执行。
 * 这样做的目的是即使用户聊得很勤、安静窗口很短，管线也不会太频繁运行。
 */
function minIntervalMs(): number {
  return env.MEMORY_MAINTAIN_MIN_INTERVAL_HOURS * 60 * 60 * 1000;
}

/** 计算延迟：取「闲置等待」和「距上次完成还需要的时间」中的最大值。 */
function computeDelay(lastPipelineAt: Date | null): number {
  const intervalMs = minIntervalMs();
  const elapsed = lastPipelineAt ? Date.now() - lastPipelineAt.getTime() : intervalMs;
  return Math.max(idleDelayMs(), intervalMs - elapsed);
}

/**
 * 为指定用户×角色调度 maintain→profile pipeline。
 * 目的：让管线在用户聊天停止后安静地执行，同时保证两次执行之间至少有足够间隔。
 * 延迟计算： delay = max(闲置等待, 两次执行最小间隔 - 距上次完成时间)
 */
export async function scheduleMaintainPipeline(
  userId: string,
  characterId: string,
): Promise<{ bullJobId: string; delayMs: number }> {
  const lastAt = await getLastMemoryPipelineAt(userId, characterId);
  const delayMs = computeDelay(lastAt);

  const queue = getQueue(MEMORY_MAINTAIN_QUEUE);
  const bullJobId = maintainPipelineJobId(userId, characterId);

  const existing = await queue.getJob(bullJobId);
  if (existing) {
    await existing.remove();
  }

  logger.info(
    {
      event: 'memory.maintain.schedule',
      userId,
      characterId,
      delayMs,
      lastPipelineAt: lastAt?.toISOString() ?? null,
    },
    '[memory] 调度 maintain pipeline',
  );

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
