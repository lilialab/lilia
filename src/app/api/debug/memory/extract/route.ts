import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { logger } from '@/lib/server/logger';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryExtractQuerySchema } from '@/schemas/api/debug/memory/extract';
import { assertGroupOwnedByUser } from '@/services/group/groups.service';
import { runExtract } from '@/services/memory/extract.service';
import { prepareMemoryJob } from '@/services/memory/job.service';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

/** 立即跑 extract（不经 Bull）；development 专用。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const { username, sessionId, groupSessionId } = parseSearchParams(
    memoryExtractQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);

  if (sessionId) {
    await assertSessionOwnedByUser(sessionId, userId);
  } else if (groupSessionId) {
    await assertGroupOwnedByUser(groupSessionId, userId);
  }

  const jobId = randomUUID();
  const job = await prepareMemoryJob(jobId, 'extract');

  runExtract(job, { sessionId, groupSessionId, userId }).catch((err) => {
    logger.error(
      { jobId, sessionId, groupSessionId, userId, username, err },
      '[API] runExtract uncaught error',
    );
  });

  return successResponse({ jobId });
});
