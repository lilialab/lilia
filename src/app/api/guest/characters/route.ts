import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { listGuestCharacters } from '@/services/guest/catalog.service';

/** 公开：访客试聊角色列表（未软删）。 */
export const GET = withApiHandler(async () => {
  const characters = await listGuestCharacters();
  return successResponse({ characters });
});
