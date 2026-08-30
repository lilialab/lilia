import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { asBullMqConnection } from '@/lib/server/redis';
import {
  MEMORY_EXTRACT_QUEUE,
  type MemoryExtractJobData,
} from '@/services/memory/extract-queue.service';
import { runExtract } from '@/services/memory/extract.service';
import { prepareMemoryJob } from '@/services/memory/job.service';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker<MemoryExtractJobData>(
  MEMORY_EXTRACT_QUEUE,
  async (bullJob) => {
    const { sessionId, groupSessionId, userId } = bullJob.data;
    const extractJob = await prepareMemoryJob(randomUUID(), 'extract');
    logger.info(
      {
        event: 'memory.extract.worker.start',
        bullJobId: bullJob.id,
        sessionId,
        groupSessionId,
        userId,
        jobId: extractJob.id,
      },
      '[Worker] 开始记忆提取',
    );
    await runExtract(extractJob, { sessionId, groupSessionId, userId });
  },
  {
    connection: asBullMqConnection(connection),
    concurrency: 1,
  },
);

worker.on('completed', (bullJob) => {
  logger.info(
    {
      event: 'memory.extract.worker.completed',
      bullJobId: bullJob.id,
      sessionId: bullJob.data.sessionId,
      groupSessionId: bullJob.data.groupSessionId,
      userId: bullJob.data.userId,
    },
    '[Worker] 记忆提取队列任务完成',
  );
});

worker.on('failed', (bullJob, err) => {
  logger.error(
    {
      event: 'memory.extract.worker.failed',
      bullJobId: bullJob?.id,
      sessionId: bullJob?.data.sessionId,
      groupSessionId: bullJob?.data.groupSessionId,
      userId: bullJob?.data.userId,
      err,
    },
    '[Worker] 记忆提取队列任务失败',
  );
});

logger.info(
  { event: 'memory.extract.worker.ready', queue: MEMORY_EXTRACT_QUEUE },
  '[Worker] 已启动',
);

async function shutdown(signal: string) {
  logger.info({ event: 'memory.extract.worker.shutdown', signal }, '[Worker] 正在关闭');
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
