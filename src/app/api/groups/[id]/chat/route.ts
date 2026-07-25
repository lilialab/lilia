import { withApiHandler, withMessageMetadata } from '@/lib/server/api-handler';
import { parseJsonBody, parseRouteParams } from '@/lib/server/parse-schema';
import { resolveRequestUserId } from '@/lib/server/request-user';
import { groupChatPostBodySchema } from '@/schemas/api/groups/chat-post';
import { groupParamsSchema } from '@/schemas/api/groups/params';
import { streamGroupChatFlow } from '@/services/group/group-chat.service';
import { assertGroupOwnedByUser } from '@/services/group/groups.service';
import { type NextRequest } from 'next/server';

export const POST = withApiHandler(
  async (req: NextRequest, context: RouteContext<'/api/groups/[id]/chat'>) => {
    const userId = await resolveRequestUserId(req);
    const { id: groupSessionId } = await parseRouteParams(groupParamsSchema, context.params);
    await assertGroupOwnedByUser(groupSessionId, userId);

    const { messages } = await parseJsonBody(groupChatPostBodySchema, req);
    const { streamResult, metadata } = await streamGroupChatFlow(
      groupSessionId,
      userId,
      messages,
    );
    // 客户端断连后仍消费完流，保证 streamText onFinish 落库
    streamResult.consumeStream();
    return streamResult.toUIMessageStreamResponse(withMessageMetadata(metadata));
  },
);
