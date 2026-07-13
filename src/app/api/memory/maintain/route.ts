import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';
import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryUsernameQuerySchema } from '@/schemas/api/memory/username';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { runMaintenance } from '@/services/memory/maintenance.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { logger } from '@/lib/server/logger';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username } = parseSearchParams(memoryUsernameQuerySchema, req.nextUrl.searchParams);
  const userId = await resolveUserIdByUsername(username);
  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'maintain');

  runMaintenance(job, userId).catch((err) => {
    logger.error({ jobId, userId, username, err }, '[API] runMaintenance uncaught error');
  });

  return successResponse({ jobId });
});
