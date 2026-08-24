import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { putLlmConfigBodySchema } from '@/schemas/api/auth/llm-config';
import { getUserLlmConfig, upsertUserLlmConfig } from '@/services/user/llm-config.service';
import { type NextRequest } from 'next/server';

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const config = await getUserLlmConfig(userId);
  return successResponse({ config });
});

export const PUT = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const body = await parseJsonBody(putLlmConfigBodySchema, req);
  const config = await upsertUserLlmConfig(userId, body);
  return successResponse({ config });
});
