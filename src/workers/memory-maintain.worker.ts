import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { asBullMqConnection } from '@/lib/server/redis';
import {
  MEMORY_MAINTAIN_PIPELINE_JOB,
  MEMORY_MAINTAIN_QUEUE,
  scheduleMaintainPipeline,
  type MemoryMaintainPipelineJobData,
} from '@/services/memory/maintain-queue.service';
import {
  getLastMemoryPipelineAt,
  runMaintainPipelineForUser,
} from '@/services/memory/maintain-pipeline.service';

function minIntervalMs(): number {
  return env.MEMORY_MAINTAIN_MIN_INTERVAL_HOURS * 60 * 60 * 1000;
}

async function main() {
  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    MEMORY_MAINTAIN_QUEUE,
    async (bullJob) => {
      if (bullJob.name !== MEMORY_MAINTAIN_PIPELINE_JOB) {
        logger.warn(
          { event: 'memory.maintain.worker.unknown', name: bullJob.name, bullJobId: bullJob.id },
          '[Worker] 未知 job name，已忽略',
        );
        return;
      }

      const { userId } = bullJob.data as MemoryMaintainPipelineJobData;
      const lastMemoryPipelineAt = await getLastMemoryPipelineAt(userId);
      const intervalMs = minIntervalMs();

      if (lastMemoryPipelineAt) {
        const elapsed = Date.now() - lastMemoryPipelineAt.getTime();
        if (elapsed < intervalMs) {
          const delayMs = intervalMs - elapsed;
          await scheduleMaintainPipeline(userId, { delayMs });
          logger.info(
            {
              event: 'memory.maintain.worker.cooldown',
              bullJobId: bullJob.id,
              userId,
              delayMs,
              lastMemoryPipelineAt: lastMemoryPipelineAt.toISOString(),
            },
            '[Worker] 距上次管线成功不足最小间隔，已再推迟',
          );
          return;
        }
      }

      logger.info(
        {
          event: 'memory.maintain.worker.start',
          bullJobId: bullJob.id,
          userId,
        },
        '[Worker] 开始 maintain→profile',
      );
      await runMaintainPipelineForUser(userId);
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
        userId: (bullJob.data as MemoryMaintainPipelineJobData | undefined)?.userId,
      },
      '[Worker] maintain pipeline 任务完成',
    );
  });

  worker.on('failed', (bullJob, err) => {
    logger.error(
      {
        event: 'memory.maintain.worker.failed',
        bullJobId: bullJob?.id,
        userId: (bullJob?.data as MemoryMaintainPipelineJobData | undefined)?.userId,
        err,
      },
      '[Worker] maintain pipeline 任务失败',
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
}

void main().catch((err) => {
  logger.error({ event: 'memory.maintain.worker.boot_failed', err }, '[Worker] 启动失败');
  process.exit(1);
});
