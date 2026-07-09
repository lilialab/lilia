import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';
import { badRequest, notFound, successResponse, withApiHandler } from '@/lib/server/api-handler';
import {
  getConsolidationJob,
  prepareConsolidationJob,
} from '@/services/memory/job.service';
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

export const GET = withApiHandler(async (req: NextRequest) => {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) badRequest('缺少 jobId 参数');

  const job = await getConsolidationJob(jobId);
  if (!job) notFound('找不到对应的任务，可能已过期');

  return successResponse(job);
});
