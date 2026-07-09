import { type NextRequest } from 'next/server';
import { notFound, successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { getMemoryJobQuerySchema } from '@/schemas/api/memory/jobs';
import { getConsolidationJob } from '@/services/memory/job.service';

export const GET = withApiHandler(async (req: NextRequest) => {
  const { jobId } = parseSearchParams(getMemoryJobQuerySchema, req.nextUrl.searchParams);

  const job = await getConsolidationJob(jobId);
  if (!job) notFound('找不到对应的任务，可能已过期');

  return successResponse(job);
});
