import { successResponse, withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { openGuestChatBodySchema } from '@/schemas/api/guest/chat-open-post';
import { openGuestChat } from '@/services/guest/chat-open.service';
import { getGuestTrialTokenFromRequest } from '@/services/guest/trial-cookie';
import { resolveGuestTrialCredential } from '@/services/guest/trial-credential.service';
import { type NextRequest } from 'next/server';

/** 打开访客试聊（清空该 guest×角色历史并返回用量）。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const credential = resolveGuestTrialCredential(getGuestTrialTokenFromRequest(req));
  const { characterId } = await parseJsonBody(openGuestChatBodySchema, req);
  const chat = await openGuestChat(credential.guestId, characterId);
  return successResponse(chat);
});
