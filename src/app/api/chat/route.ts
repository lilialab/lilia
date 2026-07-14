import { type NextRequest } from 'next/server';
import { streamChatFlow } from '@/services/chat/chat.service';
import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { chatPostBodySchema } from '@/schemas/api/chat/post';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { sessionId, messages } = await parseJsonBody(chatPostBodySchema, req);

  await assertSessionOwnedByUser(sessionId, userId);

  const chatStreamResult = await streamChatFlow(sessionId, userId, messages);
  return chatStreamResult.toUIMessageStreamResponse();
});
