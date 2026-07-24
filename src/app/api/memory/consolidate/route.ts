import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { logger } from '@/lib/server/logger';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryConsolidateQuerySchema } from '@/schemas/api/memory/consolidate';
import { runConsolidation } from '@/services/memory/consolidation.service';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, sessionId } = parseSearchParams(
    memoryConsolidateQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);
  await assertSessionOwnedByUser(sessionId, userId);

  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'extract');

  runConsolidation(job, { sessionId, userId }).catch((err) => {
    logger.error(
      { jobId, sessionId, userId, username, err },
      '[API] runConsolidation uncaught error',
    );
  });

  return successResponse({ jobId });
});
