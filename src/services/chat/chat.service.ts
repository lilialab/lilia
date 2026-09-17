import { AppError } from '@/lib/server/app-error';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import type { ChatPostBody } from '@/schemas/api/chat/post';
import { assertChatDailyTurnQuota } from '@/services/chat/quota.service';
import { resolveChatLlm } from '@/services/chat/resolve-llm';
import { scheduleMemoryExtract } from '@/services/memory/extract-queue.service';
import { scheduleMaintainPipeline } from '@/services/memory/maintain-queue.service';
import {
  claimChatGeneration,
  releaseChatGeneration,
} from '@/services/session/generation-lock.service';
import { persistUserTimeZone } from '@/services/user/users.service';
import { resolveToolsForCharacter } from '@/skills/resolve-tools';
import type { MessageMetadata, UIMessageStreamPayload } from '@/types/message-kind';
import type { InputJsonValue } from '@prisma/client/runtime/client';
import {
  convertToModelMessages,
  isStepCount,
  type LanguageModelUsage,
  streamText,
  type UIDataTypes,
} from 'ai';
import {
  findLatestMessageCreatedAt,
  getContextMessages,
  saveAssistantResponse,
} from './message.service';
import { buildSystemPrompt, resolveSessionContext } from './prompt.service';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ChatIncomingMessage = ChatPostBody['messages'][number];

type PreparedChatTurn = {
  userMessageId: string;
  startedAt: number;
  systemPrompt: string;
  modelId: string;
  characterId: string;
  modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;
  tools: ReturnType<typeof resolveToolsForCharacter>;
  metadata: MessageMetadata;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 调度记忆 extract / maintain；入队失败只记日志，不阻断聊天（如 Redis 不可用）。 */
async function scheduleMemoryJobsBestEffort(
  sessionId: string,
  userId: string,
  characterId: string,
): Promise<void> {
  try {
    await scheduleMemoryExtract(sessionId, userId);
  } catch (err) {
    logger.error(
      { err, sessionId, userId, event: 'memory.extract.schedule_failed' },
      '[memory] extract 入队失败，已跳过（聊天继续）',
    );
  }
  try {
    await scheduleMaintainPipeline(userId, characterId);
  } catch (err) {
    logger.error(
      { err, userId, characterId, event: 'memory.maintain.schedule_failed' },
      '[memory] maintain 入队失败，已跳过（聊天继续）',
    );
  }
}

function buildAssistantParts(text: string, reasoningText: string | undefined): UIDataTypes[] {
  const parts: UIDataTypes[] = [];
  if (reasoningText) {
    parts.push({ type: 'reasoning', text: reasoningText });
  }
  parts.push({ type: 'text', text });
  return parts;
}

/* -------------------------------------------------------------------------- */
/* Turn lifecycle                                                             */
/* -------------------------------------------------------------------------- */

/** 落库用户消息、组 prompt / tools / 模型上下文，供开流使用。 */
async function prepareChatTurn(
  sessionId: string,
  userId: string,
  lastMessage: ChatIncomingMessage,
  timeZone: string,
  modelId: string,
): Promise<PreparedChatTurn> {
  const previousMessageAt = await findLatestMessageCreatedAt(sessionId);
  const userMessage = await prisma.message.create({
    data: {
      sessionId,
      role: lastMessage.role,
      parts: lastMessage.parts as InputJsonValue,
      speakerUserId: userId,
    },
  });
  const userMessageId = userMessage.id;

  const {
    characterId,
    characterSlug,
    characterName,
    characterHasAvatar,
    characterAvatarUpdatedAt,
    skills,
  } = await resolveSessionContext(
    sessionId,
  );
  await scheduleMemoryJobsBestEffort(sessionId, userId, characterId);

  const contextMessages = await getContextMessages(sessionId);
  const lastUserContent = lastMessage.parts.find((p) => p.type === 'text')?.text ?? '';
  const tools = resolveToolsForCharacter(skills, { userId, characterSlug });
  const { systemPrompt, meta } = await buildSystemPrompt(sessionId, lastUserContent, {
    timeZone,
    previousMessageAt,
  });

  logger.info({
    event: 'llm.chat.request',
    sessionId,
    model: modelId,
    userMessageId,
    userContent: lastUserContent,
    contextMessageCount: contextMessages.length,
    memories: meta.memories,
    userProfile: meta.userProfile,
    skills,
    systemPrompt,
  });

  return {
    userMessageId,
    startedAt: Date.now(),
    systemPrompt,
    modelId,
    characterId,
    modelMessages: await convertToModelMessages(contextMessages),
    tools,
    metadata: {
      kind: null,
      slug: characterSlug,
      name: characterName,
      speakerId: characterId,
      hasAvatar: characterHasAvatar,
      avatarUpdatedAt: characterAvatarUpdatedAt,
    },
  };
}

/** 流结束：先放锁，再落库助手消息。 */
async function finishChatTurn(params: {
  sessionId: string;
  claimedAt: Date;
  userMessageId: string;
  startedAt: number;
  modelId: string;
  characterId: string;
  text: string;
  reasoningText: string | undefined;
  usage: LanguageModelUsage | undefined;
}): Promise<void> {
  const {
    sessionId,
    claimedAt,
    userMessageId,
    startedAt,
    modelId,
    characterId,
    text,
    reasoningText,
    usage,
  } = params;

  await releaseChatGeneration(sessionId, claimedAt);

  try {
    const { messageId: assistantMessageId } = await saveAssistantResponse(
      sessionId,
      characterId,
      buildAssistantParts(text, reasoningText),
    );

    logger.info({
      event: 'llm.chat.response',
      sessionId,
      model: modelId,
      userMessageId,
      assistantMessageId,
      text,
      reasoningText,
      durationMs: Date.now() - startedAt,
      usage,
    });
  } catch (dbErr) {
    logger.error(
      { event: 'llm.chat.response', sessionId, userMessageId, err: dbErr },
      '写入 AI 历史对白失败',
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 核心业务：控制并编排整个 RAG（检索增强生成）聊天流
 * @param sessionId 聊天会话 ID
 * @param userId 所属用户（用于滑动窗口调度 extract / maintain）
 * @param messages 前端传过来的消息（用于校验与 UI 流式协议；模型上下文以 DB 为准）
 * @param timeZone 设备 IANA 时区
 */
export async function streamChatFlow(
  sessionId: string,
  userId: string,
  messages: ChatPostBody['messages'],
  timeZone: string,
): Promise<UIMessageStreamPayload> {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== 'user') {
    throw AppError.badRequest('最后一条消息必须是用户消息');
  }

  await persistUserTimeZone(userId, timeZone);

  const chatLlm = await resolveChatLlm(userId);

  if (!chatLlm.usesUserEndpoint) {
    await assertChatDailyTurnQuota(userId);
  }

  const claimedAt = await claimChatGeneration(sessionId);

  try {
    const prepared = await prepareChatTurn(
      sessionId,
      userId,
      lastMessage,
      timeZone,
      chatLlm.modelId,
    );

    // tools 为空时等价于无工具；stopWhen 允许多步（需模型支持 tool calling）
    const streamResult = streamText({
      model: chatLlm.model,
      instructions: prepared.systemPrompt,
      messages: prepared.modelMessages,
      tools: prepared.tools,
      stopWhen: isStepCount(5),

      onEnd: async ({ text, usage, finalStep }) => {
        await finishChatTurn({
          sessionId,
          claimedAt,
          userMessageId: prepared.userMessageId,
          startedAt: prepared.startedAt,
          modelId: prepared.modelId,
          characterId: prepared.characterId,
          text,
          reasoningText: finalStep.reasoningText,
          usage,
        });
      },

      onError: async ({ error }) => {
        logger.error(
          {
            event: 'llm.chat.failed',
            sessionId,
            userMessageId: prepared.userMessageId,
            model: prepared.modelId,
            err: error,
          },
          '聊天流生成失败',
        );
        await releaseChatGeneration(sessionId, claimedAt);
      },
    });

    // 客户端断连后仍消费完流，保证 onEnd 落库；
    // consumeStream 吃掉的解析错误不会进 streamText.onError，须在此补放锁。
    void streamResult.consumeStream({
      onError: (error) => {
        logger.error(
          { event: 'llm.chat.failed', sessionId, err: error },
          '聊天流 consumeStream 失败',
        );
        void releaseChatGeneration(sessionId, claimedAt);
      },
    });

    return { streamResult, metadata: prepared.metadata };
  } catch (err) {
    await releaseChatGeneration(sessionId, claimedAt);
    throw err;
  }
}
