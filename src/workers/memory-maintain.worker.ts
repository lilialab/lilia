import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { asBullMqConnection } from '@/lib/server/redis';
import { runMaintainPipelineForUserCharacter } from '@/services/memory/maintain-pipeline.service';
import {
  MEMORY_MAINTAIN_PIPELINE_JOB,
  MEMORY_MAINTAIN_QUEUE,
  type MemoryMaintainPipelineJobData,
} from '@/services/memory/maintain-queue.service';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

/**
 * 记忆维护 + 画像刷新 Worker。
 *
 * 职责很简单：从队列取 job，直接执行管线。
 * 所有定时逻辑（闲置等待、最小间隔、滑动窗口）都由 scheduleMaintainPipeline 在入队时计算好，
 * Worker 不需要做任何冷却判断。
 */
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker<MemoryMaintainPipelineJobData>(
  MEMORY_MAINTAIN_QUEUE,
  async (bullJob) => {
    if (bullJob.name !== MEMORY_MAINTAIN_PIPELINE_JOB) {
      logger.warn(
        { event: 'memory.maintain.worker.unknown', name: bullJob.name, bullJobId: bullJob.id },
        '[Worker] 未知 job name，已忽略',
      );
      return;
    }

    const { userId, characterId } = bullJob.data;

    logger.info(
      {
        event: 'memory.maintain.worker.start',
        bullJobId: bullJob.id,
        userId,
        characterId,
      },
      '[Worker] 开始 maintain→profile',
    );
    await runMaintainPipelineForUserCharacter(userId, characterId);
  },
  {
    connection: asBullMqConnection(connection),
    concurrency: 1,
  },
);

worker.on('completed', (bullJob) => {
  logger.info(
    {
      event: 'memory.maintain.worker.completed',
      bullJobId: bullJob.id,
      userId: bullJob.data.userId,
      characterId: bullJob.data.characterId,
    },
    '[Worker] maintain pipeline 完成',
  );
});

worker.on('failed', (bullJob, err) => {
  logger.error(
    {
      event: 'memory.maintain.worker.failed',
      bullJobId: bullJob?.id,
      userId: bullJob?.data.userId,
      characterId: bullJob?.data.characterId,
      err,
    },
    '[Worker] maintain pipeline 失败',
  );
});

logger.info(
  { event: 'memory.maintain.worker.ready', queue: MEMORY_MAINTAIN_QUEUE },
  '[Worker] 已启动',
);

async function shutdown(signal: string) {
  logger.info({ event: 'memory.maintain.worker.shutdown', signal }, '[Worker] 正在关闭');
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
