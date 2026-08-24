import { withApiHandler, withMessageMetadata } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { chatPostBodySchema } from '@/schemas/api/chat/post';
import { streamChatFlow } from '@/services/chat/chat.service';
import { assertSessionOwnedByUser } from '@/services/session/sessions.service';
import { createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await resolveRequestUserId(req);
  const { sessionId, messages, timeZone } = await parseJsonBody(chatPostBodySchema, req);

  await assertSessionOwnedByUser(sessionId, userId);

  const { streamResult, metadata } = await streamChatFlow(sessionId, userId, messages, timeZone);
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: streamResult.stream,
      ...withMessageMetadata(metadata),
    }),
  });
});
