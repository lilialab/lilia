import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { getMemoryJobQuerySchema } from '@/schemas/api/memory/jobs';
import { getConsolidationJobOrThrow } from '@/services/memory/job.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const { jobId } = parseSearchParams(getMemoryJobQuerySchema, req.nextUrl.searchParams);
  const job = await getConsolidationJobOrThrow(jobId);
  return successResponse(job);
});
