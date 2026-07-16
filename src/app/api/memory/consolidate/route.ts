import { type NextRequest } from 'next/server';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryConsolidateQuerySchema } from '@/schemas/api/memory/consolidate';
import { enqueueMemoryExtractJobs } from '@/services/memory/extract-queue.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, sessionId } = parseSearchParams(
    memoryConsolidateQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);
  const result = await enqueueMemoryExtractJobs({ userId, sessionId });
  return successResponse(result);
});
