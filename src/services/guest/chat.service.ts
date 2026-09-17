import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { getChatModel } from '@/lib/server/llm';
import { logger } from '@/lib/server/logger';
import type { GuestChatPostBody } from '@/schemas/api/guest/chat-post';
import {
  claimGuestGeneration,
  releaseGuestGeneration,
} from '@/services/guest/generation-lock.service';
import {
  createGuestTrialMessage,
  findLatestGuestMessageCreatedAt,
  getGuestContextMessages,
} from '@/services/guest/message.service';
import { buildGuestSystemPrompt } from '@/services/guest/prompt.service';
import { assertGuestTrialDailyTurnQuota } from '@/services/guest/trial-quota.service';
import type { MessageMetadata, UIMessageStreamPayload } from '@/types/message-kind';
import {
  convertToModelMessages,
  isStepCount,
  type LanguageModelUsage,
  streamText,
  type UIDataTypes,
} from 'ai';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ChatIncomingMessage = GuestChatPostBody['messages'][number];

type PreparedGuestTurn = {
  userMessageId: string;
  startedAt: number;
  systemPrompt: string;
  modelId: string;
  characterId: string;
  modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;
  metadata: MessageMetadata;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function buildAssistantParts(text: string, reasoningText: string | undefined): UIDataTypes[] {
  const parts: UIDataTypes[] = [];
  if (reasoningText) {
    parts.push({ type: 'reasoning', text: reasoningText });
  }
  parts.push({ type: 'text', text });
  return parts;
}

/** 落库用户消息、组 prompt / 模型上下文；无工具、无记忆。 */
async function prepareGuestTurn(params: {
  guestId: string;
  characterId: string;
  lastMessage: ChatIncomingMessage;
  timeZone: string;
  modelId: string;
  clientIp: string | null;
}): Promise<PreparedGuestTurn> {
  const { guestId, characterId, lastMessage, timeZone, modelId, clientIp } = params;

  const previousMessageAt = await findLatestGuestMessageCreatedAt(guestId, characterId);
  const userMessage = await createGuestTrialMessage({
    guestId,
    characterId,
    role: lastMessage.role,
    parts: lastMessage.parts as UIDataTypes[],
    clientIp,
  });

  const { systemPrompt, character } = await buildGuestSystemPrompt(
    characterId,
    timeZone,
    previousMessageAt,
  );
  const contextMessages = await getGuestContextMessages(guestId, characterId);
  const lastUserContent = lastMessage.parts.find((p) => p.type === 'text')?.text ?? '';

  logger.info({
    event: 'llm.guest_chat.request',
    guestId,
    characterId,
    model: modelId,
    userMessageId: userMessage.id,
    userContent: lastUserContent,
    contextMessageCount: contextMessages.length,
    systemPrompt,
  });

  return {
    userMessageId: userMessage.id,
    startedAt: Date.now(),
    systemPrompt,
    modelId,
    characterId,
    modelMessages: await convertToModelMessages(contextMessages),
    metadata: {
      kind: null,
      slug: character.slug,
      name: character.name,
      speakerId: character.id,
      hasAvatar: character.hasAvatar,
      avatarUpdatedAt: character.avatarUpdatedAt,
    },
  };
}

async function finishGuestTurn(params: {
  guestId: string;
  characterId: string;
  claimedAt: number;
  userMessageId: string;
  startedAt: number;
  modelId: string;
  text: string;
  reasoningText: string | undefined;
  usage: LanguageModelUsage | undefined;
  clientIp: string | null;
}): Promise<void> {
  const {
    guestId,
    characterId,
    claimedAt,
    userMessageId,
    startedAt,
    modelId,
    text,
    reasoningText,
    usage,
    clientIp,
  } = params;

  await releaseGuestGeneration(guestId, characterId, claimedAt);

  try {
    const assistant = await createGuestTrialMessage({
      guestId,
      characterId,
      role: 'assistant',
      parts: buildAssistantParts(text, reasoningText),
      clientIp,
    });

    logger.info({
      event: 'llm.guest_chat.response',
      guestId,
      characterId,
      model: modelId,
      userMessageId,
      assistantMessageId: assistant.id,
      text,
      reasoningText,
      durationMs: Date.now() - startedAt,
      usage,
    });
  } catch (dbErr) {
    logger.error(
      { event: 'llm.guest_chat.response', guestId, characterId, userMessageId, err: dbErr },
      '写入访客试聊助手消息失败',
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 访客试聊流：平台模型、日限额、独立消息表、无记忆/无影子 User。
 */
export async function streamGuestChatFlow(
  guestId: string,
  characterId: string,
  messages: GuestChatPostBody['messages'],
  timeZone: string,
  clientIp: string | null,
): Promise<UIMessageStreamPayload> {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== 'user') {
    throw AppError.badRequest('最后一条消息必须是用户消息');
  }

  await assertGuestTrialDailyTurnQuota(guestId);

  const model = getChatModel();
  const modelId = env.LLM_MODEL;
  const claimedAt = await claimGuestGeneration(guestId, characterId);

  try {
    const prepared = await prepareGuestTurn({
      guestId,
      characterId,
      lastMessage,
      timeZone,
      modelId,
      clientIp,
    });

    const streamResult = streamText({
      model,
      instructions: prepared.systemPrompt,
      messages: prepared.modelMessages,
      stopWhen: isStepCount(5),

      onEnd: async ({ text, usage, finalStep }) => {
        await finishGuestTurn({
          guestId,
          characterId: prepared.characterId,
          claimedAt,
          userMessageId: prepared.userMessageId,
          startedAt: prepared.startedAt,
          modelId: prepared.modelId,
          text,
          reasoningText: finalStep.reasoningText,
          usage,
          clientIp,
        });
      },

      onError: async ({ error }) => {
        logger.error(
          {
            event: 'llm.guest_chat.failed',
            guestId,
            characterId,
            userMessageId: prepared.userMessageId,
            model: prepared.modelId,
            err: error,
          },
          '访客试聊流生成失败',
        );
        await releaseGuestGeneration(guestId, characterId, claimedAt);
      },
    });

    void streamResult.consumeStream({
      onError: (error) => {
        logger.error(
          { event: 'llm.guest_chat.failed', guestId, characterId, err: error },
          '访客试聊 consumeStream 失败',
        );
        void releaseGuestGeneration(guestId, characterId, claimedAt);
      },
    });

    return { streamResult, metadata: prepared.metadata };
  } catch (err) {
    await releaseGuestGeneration(guestId, characterId, claimedAt);
    throw err;
  }
}
