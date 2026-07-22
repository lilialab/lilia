import { type UIDataTypes, streamText, convertToModelMessages, stepCountIs } from 'ai';
import { AppError } from '@/lib/server/app-error';
import { ollamaProvider } from '@/lib/server/ollama';
import { prisma } from '@/lib/server/prisma';
import { logger } from '@/lib/server/logger';
import { env } from '@/lib/server/env';
import { extractTextFromParts } from '@/lib/message-parts';
import type { GroupChatPostBody } from '@/schemas/api/groups/chat-post';
import { getUserTimeZone } from '@/services/user/users.service';
import { DEFAULT_CHARACTER_ID, loadCharacter } from '@/prompts/load';
import { resolveToolsForCharacter } from '@/skills/resolve-tools';
import { isTurnCueKind, type UIMessageStreamPayload } from '@/types/message-kind';
import {
  createGroupUserMessage,
  getGroupContextMessages,
  getLatestRealUserMessageText,
  saveGroupAssistantResponse,
} from './group-message.service';
import { buildGroupSystemPrompt } from './group-prompt.service';

type GroupSpeaker = { characterId: string; slug: string };

/** 解析 slug 是否为该群成员；命中则返回角色 id 与 slug。 */
async function findGroupMemberBySlug(
  groupSessionId: string,
  slug: string,
): Promise<GroupSpeaker | null> {
  const member = await prisma.groupMember.findFirst({
    where: {
      groupSessionId,
      character: { slug },
    },
    select: {
      characterId: true,
      character: { select: { slug: true } },
    },
  });

  if (!member) return null;
  return { characterId: member.characterId, slug: member.character.slug };
}

/** 群成员流式回复（上下文来自 DB；调用方已落库 user / turn_cue，并解析好 speaker）。 */
export async function streamGroupAssistantReply(options: {
  groupSessionId: string;
  userId: string;
  speaker: GroupSpeaker;
  lastUserContentForRag: string;
  /** 关联日志用，用户主动发送时有值 */
  userMessageId?: string;
}): Promise<UIMessageStreamPayload> {
  const { groupSessionId, userId, speaker, lastUserContentForRag, userMessageId } = options;

  const timeZone = await getUserTimeZone(userId);
  const character = loadCharacter(speaker.slug);
  const tools = resolveToolsForCharacter(character.skills, {
    userId,
    characterSlug: speaker.slug,
  });
  const contextMessages = await getGroupContextMessages(groupSessionId);
  const { systemPrompt, meta } = await buildGroupSystemPrompt({
    userId,
    characterSlug: speaker.slug,
    lastUserContent: lastUserContentForRag,
    timeZone,
  });

  logger.info({
    event: 'llm.group_chat.request',
    groupSessionId,
    model: env.OLLAMA_MODEL,
    userMessageId,
    characterSlug: speaker.slug,
    userContent: lastUserContentForRag,
    contextMessageCount: contextMessages.length,
    memoryFragments: meta.memoryFragments,
    userProfile: meta.userProfile,
    skills: character.skills,
  });

  const startedAt = Date.now();

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
          text,
        });

        const { messageId: assistantMessageId } = await saveGroupAssistantResponse(
          groupSessionId,
          speaker.characterId,
          assistantParts,
        );

        logger.info({
          event: 'llm.group_chat.response',
          groupSessionId,
          model: env.OLLAMA_MODEL,
          userMessageId,
          assistantMessageId,
          characterSlug: speaker.slug,
          text,
          reasoningText,
          durationMs: Date.now() - startedAt,
          usage,
        });
      } catch (dbErr) {
        logger.error(
          { event: 'llm.group_chat.response', groupSessionId, userMessageId, err: dbErr },
          '写入群聊 AI 回复失败',
        );
      }
    },
  });

  return {
    streamResult,
    metadata: {
      kind: null,
      slug: speaker.slug,
      speakerDisplayName: character.displayName,
      speakerCharacterId: speaker.characterId,
    },
  };
}

/**
 * 群聊发送：落库用户消息（含可选 turn_cue）后召唤一位角色。
 * @param messages 前端 UI 消息（只取最后一条 user；kind/slug 在 metadata；模型上下文以 DB 为准）
 */
export async function streamGroupChatFlow(
  groupSessionId: string,
  userId: string,
  messages: GroupChatPostBody['messages'],
): Promise<UIMessageStreamPayload> {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== 'user') {
    throw AppError.badRequest('最后一条消息必须是用户消息');
  }

  const kind = lastMessage.metadata?.kind ?? null;
  const slug = lastMessage.metadata?.slug ?? null;
  const isTurnCue = isTurnCueKind(kind);
  const { id: userMessageId } = await createGroupUserMessage(
    groupSessionId,
    lastMessage.parts,
    kind,
  );
  const text = extractTextFromParts(lastMessage.parts);

  if (isTurnCue) {
    if (!slug) {
      throw AppError.badRequest('续聊触发语须指定 slug');
    }
    const speaker = await findGroupMemberBySlug(groupSessionId, slug);
    if (!speaker) {
      throw AppError.badRequest('该角色不在群内');
    }
    return streamGroupAssistantReply({
      groupSessionId,
      userId,
      speaker,
      lastUserContentForRag: await getLatestRealUserMessageText(groupSessionId),
      userMessageId,
    });
  }

  const speaker =
    (slug !== null ? await findGroupMemberBySlug(groupSessionId, slug) : null) ??
    (await findGroupMemberBySlug(groupSessionId, DEFAULT_CHARACTER_ID));

  if (!speaker) {
    throw AppError.badRequest('群聊须包含 arbor');
  }

  return streamGroupAssistantReply({
    groupSessionId,
    userId,
    speaker,
    lastUserContentForRag: text,
    userMessageId,
  });
}
