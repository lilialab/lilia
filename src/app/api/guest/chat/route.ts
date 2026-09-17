import { withApiHandler, withMessageMetadata } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { guestChatPostBodySchema } from '@/schemas/api/guest/chat-post';
import { streamGuestChatFlow } from '@/services/guest/chat.service';
import { getRequestClientIp } from '@/services/guest/request-ip';
import { getGuestTrialTokenFromRequest } from '@/services/guest/trial-cookie';
import { resolveGuestTrialCredential } from '@/services/guest/trial-credential.service';
import { createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { type NextRequest } from 'next/server';

/** 访客试聊流式对话（需当日凭证；扣日限额；独立消息表）。 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const credential = resolveGuestTrialCredential(getGuestTrialTokenFromRequest(req));
  const { characterId, messages, timeZone } = await parseJsonBody(guestChatPostBodySchema, req);
  const clientIp = getRequestClientIp(req);

  const { streamResult, metadata } = await streamGuestChatFlow(
    credential.guestId,
    characterId,
    messages,
    timeZone,
    clientIp,
  );
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: streamResult.stream,
      ...withMessageMetadata(metadata),
    }),
  });
});
