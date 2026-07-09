import { type NextRequest } from 'next/server';
import { streamChatFlow } from '@/services/chat/chat.service';
import { withApiHandler } from '@/lib/server/api-handler';
import { parseJsonBody } from '@/lib/server/parse-schema';
import { chatPostBodySchema } from '@/schemas/api/chat/post';

export const POST = withApiHandler(async (req: NextRequest) => {
  const { sessionId, messages } = await parseJsonBody(chatPostBodySchema, req);

  const chatStreamResult = await streamChatFlow(sessionId, messages);
  return chatStreamResult.toUIMessageStreamResponse();
});
