import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { getMemoryJobQuerySchema } from '@/schemas/api/debug/memory/jobs';
import { getMemoryJobOrThrow } from '@/services/memory/job.service';
import { type NextRequest } from 'next/server';

/** 查询记忆 Job；development 专用。 */
export const GET = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const { jobId } = parseSearchParams(getMemoryJobQuerySchema, req.nextUrl.searchParams);
  const job = await getMemoryJobOrThrow(jobId);
  return successResponse(job);
});
