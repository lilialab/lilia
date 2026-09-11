import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { assertDevelopmentDebug } from '@/lib/server/debug-guard';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { debugProfilePostBodySchema } from '@/schemas/api/debug/profile/post-body';
import { getProfileDebugMeta, previewProfile } from '@/services/debug/profile-preview.service';
import { type NextRequest } from 'next/server';

export const maxDuration = 120;

/** 画像调试元数据：角色列表与 JSON 夹具。 */
export const GET = withApiHandler(async () => {
  assertDevelopmentDebug();
  return successResponse(await getProfileDebugMeta());
});

/** 画像 dry-run，不写库。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  assertDevelopmentDebug();
  const { characterSlug, existing, referenceMemories } = await parseJsonBody(
    debugProfilePostBodySchema,
    req,
  );
  const result = await previewProfile(characterSlug, existing, referenceMemories);
  return successResponse(result);
});
