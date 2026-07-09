import { randomUUID } from 'crypto';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { runProfileRefresh } from '@/services/memory/user-profile.service';
import { logger } from '@/lib/server/logger';

export const POST = withApiHandler(async () => {
  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'profile');

  runProfileRefresh(job).catch((err) => {
    logger.error({ jobId, err }, '[API] runProfileRefresh uncaught error');
  });

  return successResponse({ jobId });
});
