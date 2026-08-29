import { DEFAULT_LOCALE } from '@/i18n/config';
import { AppError } from '@/lib/server/app-error';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { loadCharacterSkills } from '@/prompts/load';
import type { GroupChatPostBody } from '@/schemas/api/groups/chat-post';
import { assertChatDailyTurnQuota } from '@/services/chat/quota.service';
import { resolveChatLlm, type ResolvedChatLlm } from '@/services/chat/resolve-llm';
import { scheduleGroupMemoryExtract } from '@/services/memory/extract-queue.service';
import { scheduleMaintainPipeline } from '@/services/memory/maintain-queue.service';
import {
  claimGroupGeneration,
  releaseGroupGeneration,
} from '@/services/session/generation-lock.service';
import { getUserById } from '@/services/user/users.service';
import { resolveToolsForCharacter } from '@/skills/resolve-tools';
import { API_ERROR_CODE } from '@/types/api-error';
import { isTurnCueKind, type UIMessageStreamPayload } from '@/types/message-kind';
import { extractTextFromParts } from '@/utils/message-parts';
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
import {
  createGroupUserMessage,
  getGroupContextMessages,
  saveGroupAssistantResponse,
} from './message.service';
import { extractLatestContextTextForRag, withGroupSpeakerLabelsForModel } from './message.utils';
import { buildGroupSystemPrompt } from './prompt.service';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type GroupSpeaker = { characterId: string; slug: string };
type GroupMemberRef = { characterId: string; character: { slug: string } };

/** 调度群聊 extract 与 maintain pipeline；入队失败只记日志，不阻断聊天。 */
async function scheduleGroupMemoryJobsBestEffort(
  groupSessionId: string,
  userId: string,
  members: GroupMemberRef[],
): Promise<void> {
  try {
    await scheduleGroupMemoryExtract(groupSessionId, userId);
  } catch (err) {
    logger.error(
      { err, groupSessionId, userId, event: 'memory.extract.schedule_failed' },
      '[memory] 群 extract 入队失败，已跳过（聊天继续）',
    );
  }

  for (const { characterId } of members) {
    try {
      await scheduleMaintainPipeline(userId, characterId);
    } catch (err) {
      logger.error(
        { err, userId, characterId, event: 'memory.maintain.schedule_failed' },
        '[memory] 群 maintain 入队失败，已跳过',
      );
    }
  }
}

/** 群成员流式回复（上下文来自 DB；调用方已落库 user / turn_cue，并解析好 speaker）。 */
interface StreamGroupAssistantReplyOptions {
  groupSessionId: string;
  userId: string;
  speaker: GroupSpeaker;
  /** 关联日志用，用户主动发送时有值 */
  userMessageId?: string;
  /**
   * 仅注入本次 LLM 请求末尾的 user 回合（不落库上下文）。
   * turn_cue 历史已从 getGroupContextMessages 排除，召唤时必须带上，否则对话以 assistant 结尾易空回复。
   */
  ephemeralUserText?: string;
  /** claimGroupGeneration 返回值，流结束 / 出错时释放 */
  generationClaimedAt: Date;
  chatLlm: ResolvedChatLlm;
  /** 群成员列表（提供则跳过花名册 DB 查询） */
  members: GroupMemberRef[];
  timeZone: string;
}

/* -------------------------------------------------------------------------- */
/* Turn lifecycle                                                             */
/* -------------------------------------------------------------------------- */

export async function streamGroupAssistantReply({
  groupSessionId,
  userId,
  speaker,
  userMessageId,
  ephemeralUserText,
  generationClaimedAt,
  chatLlm,
  members,
  timeZone,
}: StreamGroupAssistantReplyOptions): Promise<UIMessageStreamPayload> {
  const user = await getUserById(userId);
  const skills = loadCharacterSkills(speaker.slug);
  const tools = resolveToolsForCharacter(skills, {
    userId,
    characterSlug: speaker.slug,
  });
  const contextMessages = await getGroupContextMessages(groupSessionId);
  const ragQueryText = extractLatestContextTextForRag(contextMessages);
  const labeledContext = withGroupSpeakerLabelsForModel(contextMessages);
  const messagesForModel: UIMessage[] = [...labeledContext];
  if (ephemeralUserText) {
    messagesForModel.push({
      id: `ephemeral-turn-cue-${userMessageId ?? 'now'}`,
      role: 'user',
      parts: [{ type: 'text', text: ephemeralUserText }],
    });
  }
  const { systemPrompt, meta } = await buildGroupSystemPrompt({
    userId,
    userNickname: user?.nickname ?? '用户',
    characterId: speaker.characterId,
    characterSlug: speaker.slug,
    memberSlugs: members.map((m) => m.character.slug),
    lastUserContent: ragQueryText,
    timeZone,
    locale: user?.locale ?? DEFAULT_LOCALE,
  });

  logger.info({
    event: 'llm.group_chat.request',
    groupSessionId,
    model: chatLlm.modelId,
    userMessageId,
    characterSlug: speaker.slug,
    userContent: ragQueryText,
    ephemeralUserText: ephemeralUserText ?? null,
    contextMessageCount: contextMessages.length,
    memories: meta.memories,
    userProfile: meta.userProfile,
    groupChatRules: meta.groupChatRules,
    rosterBlock: meta.rosterBlock,
    skills,
  });

  const startedAt = Date.now();

  const streamResult = streamText({
    model: chatLlm.model,
    instructions: systemPrompt,
    messages: await convertToModelMessages(messagesForModel),
    tools,
    stopWhen: isStepCount(5),

    onEnd: async ({ text, usage, finalStep }) => {
      await releaseGroupGeneration(groupSessionId, generationClaimedAt);
      const reasoningText = finalStep.reasoningText;

      try {
        const assistantParts: UIDataTypes[] = [];

        if (reasoningText) {
          assistantParts.push({
            type: 'reasoning',
            text: reasoningText,
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
          model: chatLlm.modelId,
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

    onError: async ({ error }) => {
      logger.error(
        {
          event: 'llm.group_chat.failed',
          groupSessionId,
          userMessageId,
          characterSlug: speaker.slug,
          model: chatLlm.modelId,
          err: error,
        },
        '群聊流生成失败',
      );
      await releaseGroupGeneration(groupSessionId, generationClaimedAt);
    },
  });

  // 客户端断连后仍消费完流，保证 onEnd 落库；
  // consumeStream 吃掉的解析错误不会进 streamText.onError，须在此补放锁。
  void streamResult.consumeStream({
    onError: (error) => {
      logger.error(
        { event: 'llm.group_chat.failed', groupSessionId, err: error },
        '群聊流 consumeStream 失败',
      );
      void releaseGroupGeneration(groupSessionId, generationClaimedAt);
    },
  });

  return {
    streamResult,
    metadata: {
      kind: null,
      slug: speaker.slug,
      speakerCharacterId: speaker.characterId,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 群聊发送：落库用户消息（含可选 turn_cue）后召唤一位角色。
 * @param messages 前端 UI 消息（只取最后一条 user；kind/slug 在 metadata；模型上下文以 DB 为准）
 * @param timeZone 设备 IANA 时区
 */
export async function streamGroupChatFlow(
  groupSessionId: string,
  userId: string,
  messages: GroupChatPostBody['messages'],
  timeZone: string,
): Promise<UIMessageStreamPayload> {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== 'user') {
    throw AppError.badRequest('最后一条消息必须是用户消息');
  }

  const chatLlm = await resolveChatLlm(userId);
  if (!chatLlm.usesUserEndpoint) {
    await assertChatDailyTurnQuota(userId);
  }

  const claimedAt = await claimGroupGeneration(groupSessionId);

  try {
    const kind = lastMessage.metadata?.kind ?? null;
    const slug = lastMessage.metadata?.slug ?? null;
    const isTurnCue = isTurnCueKind(kind);
    const { id: userMessageId } = await createGroupUserMessage(
      groupSessionId,
      lastMessage.parts,
      kind,
    );
    const members = await prisma.groupMember.findMany({
      where: { groupSessionId },
      select: { characterId: true, character: { select: { slug: true } } },
      orderBy: { createdAt: 'asc' },
    });
    await scheduleGroupMemoryJobsBestEffort(groupSessionId, userId, members);
    const text = extractTextFromParts(lastMessage.parts);

    if (isTurnCue) {
      if (!slug) {
        throw AppError.badRequest('续聊触发语须指定 slug');
      }
      const member = members.find((m) => m.character.slug === slug);
      if (!member) {
        throw AppError.badRequest('该角色不在群内', API_ERROR_CODE.CHARACTER_NOT_IN_GROUP);
      }
      return streamGroupAssistantReply({
        groupSessionId,
        userId,
        speaker: { characterId: member.characterId, slug: member.character.slug },
        userMessageId,
        ephemeralUserText: text,
        generationClaimedAt: claimedAt,
        chatLlm,
        members,
        timeZone,
      });
    }

    if (!slug) {
      throw AppError.badRequest('须指定要 @ 的群成员');
    }
    const member = members.find((m) => m.character.slug === slug);
    if (!member) {
      throw AppError.badRequest('该角色不在群内', API_ERROR_CODE.CHARACTER_NOT_IN_GROUP);
    }

    return streamGroupAssistantReply({
      groupSessionId,
      userId,
      speaker: { characterId: member.characterId, slug: member.character.slug },
      userMessageId,
      generationClaimedAt: claimedAt,
      chatLlm,
      members,
      timeZone,
    });
  } catch (err) {
    await releaseGroupGeneration(groupSessionId, claimedAt);
    throw err;
  }
}
