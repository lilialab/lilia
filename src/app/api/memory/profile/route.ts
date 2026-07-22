import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { logger } from '@/lib/server/logger';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryUsernameQuerySchema } from '@/schemas/api/memory/username';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { runProfileRefresh } from '@/services/memory/user-profile.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username } = parseSearchParams(memoryUsernameQuerySchema, req.nextUrl.searchParams);
  const userId = await resolveUserIdByUsername(username);
  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'profile');

  runProfileRefresh(job, userId).catch((err) => {
    logger.error({ jobId, userId, username, err }, '[API] runProfileRefresh uncaught error');
  });

  return successResponse({ jobId });
});
