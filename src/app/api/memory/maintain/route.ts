import { randomUUID } from 'crypto';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { runMaintenance } from '@/services/memory/maintenance.service';
import { logger } from '@/lib/server/logger';

export const POST = withApiHandler(async () => {
  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'maintain');

  runMaintenance(job).catch((err) => {
    logger.error({ jobId, err }, '[API] runMaintenance uncaught error');
  });

  return successResponse({ jobId });
});
