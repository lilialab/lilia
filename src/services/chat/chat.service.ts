import { type UIDataTypes, streamText, convertToModelMessages, stepCountIs } from 'ai';
import type { InputJsonValue } from '@prisma/client/runtime/client';
import type { ChatPostBody } from '@/schemas/api/chat/post';
import { ollamaProvider } from '@/lib/server/ollama';
import { prisma } from '@/lib/server/prisma';
import { logger } from '@/lib/server/logger';
import { env } from '@/lib/server/env';
import { AppError } from '@/lib/server/app-error';
import { scheduleMemoryExtract } from '@/services/memory/extract-queue.service';
import { scheduleMaintainPipeline } from '@/services/memory/maintain-queue.service';
import { getUserTimeZone } from '@/services/user/users.service';
import { loadCharacter } from '@/prompts/load';
import { resolveToolsForCharacter } from '@/skills/resolve-tools';
import type { UIMessageStreamPayload } from '@/types/message-kind';
import { buildSystemPrompt, resolveSessionContext } from './prompt-builder.service';
import { saveAssistantResponse, getContextMessages } from './message.service';

/** 调度记忆 extract / maintain；入队失败只记日志，不阻断聊天（如 Redis 不可用）。 */
async function scheduleMemoryJobsBestEffort(sessionId: string, userId: string): Promise<void> {
  try {
    await scheduleMemoryExtract(sessionId, userId);
  } catch (err) {
    logger.error(
      { err, sessionId, userId, event: 'memory.extract.schedule_failed' },
      '[memory] extract 入队失败，已跳过（聊天继续）',
    );
  }
  try {
    await scheduleMaintainPipeline(userId);
  } catch (err) {
    logger.error(
      { err, userId, event: 'memory.maintain.schedule_failed' },
      '[memory] maintain 入队失败，已跳过（聊天继续）',
    );
  }
}

/**
 * 核心业务：控制并编排整个 RAG（检索增强生成）聊天流（适配 AI SDK 5.0 Parts 架构）
 * @param sessionId 聊天会话 ID
 * @param userId 所属用户（用于滑动窗口调度 extract / maintain，以及库内时区）
 * @param messages 前端传过来的消息（用于校验与 UI 流式协议；模型上下文以 DB 为准）
 */
export async function streamChatFlow(
  sessionId: string,
  userId: string,
  messages: ChatPostBody['messages'],
): Promise<UIMessageStreamPayload> {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== 'user') {
    throw AppError.badRequest('最后一条消息必须是用户消息');
  }

  const userMessage = await prisma.message.create({
    data: {
      sessionId,
      role: lastMessage.role,
      parts: lastMessage.parts as InputJsonValue,
    },
  });
  const userMessageId = userMessage.id;

  await scheduleMemoryJobsBestEffort(sessionId, userId);

  const contextMessages = await getContextMessages(sessionId);

  const lastUserContent = lastMessage.parts.find((p) => p.type === 'text')?.text ?? '';
  const timeZone = await getUserTimeZone(userId);
  const { characterId, characterSlug, characterDisplayName } =
    await resolveSessionContext(sessionId);
  const character = loadCharacter(characterSlug);
  const tools = resolveToolsForCharacter(character.skills, { userId, characterSlug });

  const { systemPrompt, meta } = await buildSystemPrompt(sessionId, lastUserContent, { timeZone });

  logger.info({
    event: 'llm.chat.request',
    sessionId,
    model: env.OLLAMA_MODEL,
    userMessageId,
    userContent: lastUserContent,
    contextMessageCount: contextMessages.length,
    memoryFragments: meta.memoryFragments,
    userProfile: meta.userProfile,
    skills: character.skills,
  });

  const startedAt = Date.now();

  // tools 为空时等价于无工具；stopWhen 允许多步（需模型支持 tool calling）
  const streamResult = streamText({
    model: ollamaProvider(env.OLLAMA_MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(contextMessages),
    tools,
    stopWhen: stepCountIs(5),

    onFinish: async ({ text, reasoningText, usage }) => {
      try {
        const assistantParts: UIDataTypes[] = [];

        if (reasoningText) {
          assistantParts.push({
            type: 'reasoning',
            reasoning: reasoningText,
          });
        }

        assistantParts.push({
          type: 'text',
          text: text,
        });

        const { messageId: assistantMessageId } = await saveAssistantResponse(
          sessionId,
          assistantParts,
        );

        logger.info({
          event: 'llm.chat.response',
          sessionId,
          model: env.OLLAMA_MODEL,
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
    },
  });

  const metadata = {
    kind: null,
    slug: characterSlug,
    speakerDisplayName: characterDisplayName,
    speakerCharacterId: characterId,
  };
  return { streamResult, metadata };
}
