import { randomUUID } from 'crypto';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { runConsolidation } from '@/services/memory/consolidation.service';
import { logger } from '@/lib/server/logger';

export const POST = withApiHandler(async () => {
  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'extract');

  runConsolidation(job).catch((err) => {
    logger.error({ jobId, err }, '[API] runConsolidation uncaught error');
  });

  return successResponse({ jobId });
});
