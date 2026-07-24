import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { logger } from '@/lib/server/logger';
import { parseSearchParams } from '@/lib/server/parse-schema';
import { memoryMaintainQuerySchema } from '@/schemas/api/memory/maintain';
import { assertIsContact } from '@/services/character/contacts.service';
import { prepareConsolidationJob } from '@/services/memory/job.service';
import { runMaintenance } from '@/services/memory/maintenance.service';
import { resolveUserIdByUsername } from '@/services/user/users.service';
import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { username, characterId } = parseSearchParams(
    memoryMaintainQuerySchema,
    req.nextUrl.searchParams,
  );
  const userId = await resolveUserIdByUsername(username);
  await assertIsContact(userId, characterId);

  const jobId = randomUUID();
  const job = await prepareConsolidationJob(jobId, 'maintain');

  runMaintenance(job, userId, characterId).catch((err) => {
    logger.error(
      { jobId, userId, characterId, username, err },
      '[API] runMaintenance uncaught error',
    );
  });

  return successResponse({ jobId });
});
