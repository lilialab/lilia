import { env } from '@/lib/server/env';
import { getChatModel } from '@/lib/server/llm';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { loadExtractPrompt } from '@/prompts/load';
import type { ConsolidationJob, ExtractedMemory } from '@/types/consolidation-job';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import {
  type ConsolidationParseResult,
  consolidationSpeakerLabel,
  type FinishedMemory,
  isIncludedInGroupExtract,
  mapConsolidationOutput,
  validateAndMergeIds,
} from './consolidation.utils';
import { updateConsolidationJob } from './job.service';
import { buildUserMemoryWritePayload, syncUserMemoriesToChroma } from './memory-lifecycle.service';

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

const consolidationOutputSchema = z.object({
  finished_memories: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['preference', 'event', 'fact']),
      source_message_ids: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

interface TranscriptResult {
  transcript: string;
  messageIds: string[];
}

export type RunConsolidationParams = {
  userId: string;
  sessionId?: string;
  groupSessionId?: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 将单条消息格式化为 LLM 可读的 XML 片段；无有效文本时返回 null。 */
function formatMessageXml(id: string, seq: number, label: string, parts: unknown): string | null {
  const messageParts = parts as { type: string; text?: string }[];
  const text = messageParts
    .flatMap((part) => (part.type === 'text' && part.text ? [part.text] : []))
    .join(' ')
    .trim();

  if (!text) return null;

  return `<message id="${id}" seq="${seq}">${label}: ${text}</message>`;
}

/** 将内部记忆结构转换为 job 结果中的精简格式。 */
function toJobMemories(memories: FinishedMemory[]): ExtractedMemory[] {
  return memories.map(({ text, type, confidence }) => ({ text, type, confidence }));
}

type ConsolidationResult = NonNullable<ConsolidationJob['result']>;

/** 构造空的整理结果（无可提取记忆、无已标记消息）。 */
function emptyResult(deferredMessageCount = 0): ConsolidationResult {
  return {
    memoriesExtracted: 0,
    memories: [],
    consolidatedMessageCount: 0,
    unfinishedMessageCount: deferredMessageCount,
  };
}

/** 将 job 标记为已完成并写入进度与结果。 */
function completeJob(
  job: ConsolidationJob,
  progress: string,
  result: ConsolidationResult,
  snapshot?: ConsolidationJob['snapshot'],
): Promise<void> {
  return updateConsolidationJob(job.id, {
    status: 'completed',
    completedAt: Date.now(),
    progress,
    result,
    snapshot,
  });
}

/** 将 job 标记为失败并记录错误信息。 */
function failJob(job: ConsolidationJob, errorMessage: string): Promise<void> {
  return updateConsolidationJob(job.id, {
    status: 'failed',
    completedAt: Date.now(),
    progress: '记忆整理失败，可稍后重试。',
    error: errorMessage,
  });
}

/* -------------------------------------------------------------------------- */
/* Transcript                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 捞取指定单聊会话未整理的消息，按时间正序构建带 id + seq 的 XML transcript。
 */
async function buildSessionTranscript(sessionId: string): Promise<TranscriptResult | null> {
  const messages = await prisma.message.findMany({
    where: {
      isConsolidated: false,
      sessionId,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      parts: true,
    },
  });

  if (messages.length === 0) return null;

  const messageIds = messages.map((message) => message.id);
  const lines = messages.flatMap((message, seq) => {
    const label = consolidationSpeakerLabel(message.role);
    const line = formatMessageXml(message.id, seq, label, message.parts);
    return line === null ? [] : [line];
  });

  return {
    transcript: lines.join('\n'),
    messageIds,
  };
}

/**
 * 捞取群聊未整理消息（排除 turn_cue），助理标签用 slug。
 */
async function buildGroupTranscript(groupSessionId: string): Promise<TranscriptResult | null> {
  const messages = await prisma.message.findMany({
    where: {
      isConsolidated: false,
      groupSessionId,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      kind: true,
      parts: true,
      speakerCharacter: { select: { slug: true } },
    },
  });

  const included = messages.filter((message) => isIncludedInGroupExtract(message.kind));
  if (included.length === 0) return null;

  const messageIds = included.map((message) => message.id);
  const lines = included.flatMap((message, seq) => {
    const label = consolidationSpeakerLabel(message.role, {
      assistantSlug: message.speakerCharacter?.slug,
    });
    const line = formatMessageXml(message.id, seq, label, message.parts);
    return line === null ? [] : [line];
  });

  return {
    transcript: lines.join('\n'),
    messageIds,
  };
}

/** 读取群当前成员 characterId 列表（job 执行时快照）。 */
async function loadGroupMemberCharacterIds(groupSessionId: string): Promise<string[]> {
  const members = await prisma.groupMember.findMany({
    where: { groupSessionId },
    select: { characterId: true },
    orderBy: { createdAt: 'asc' },
  });
  return members.map((member) => member.characterId);
}

/** 单聊会话的 characterId。 */
async function loadSessionCharacterId(sessionId: string): Promise<string | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { characterId: true },
  });
  return session?.characterId ?? null;
}

/* -------------------------------------------------------------------------- */
/* Extraction                                                                 */
/* -------------------------------------------------------------------------- */

/** 调用模型从 transcript 提取记忆，LLM 上下文写入 Loki，job snapshot 仅保留 messageIds/userId。 */
async function extractMemoriesFromTranscript(
  job: ConsolidationJob,
  transcript: string,
  messageIds: string[],
  userId: string,
  scope: { sessionId?: string; groupSessionId?: string },
  characterId: string,
): Promise<{ parsed: ConsolidationParseResult } | { error: string }> {
  const systemPrompt = loadExtractPrompt(characterId);
  await updateConsolidationJob(job.id, {
    progress: `正在调用模型提取记忆（${messageIds.length} 条消息）...`,
    snapshot: {
      messageIds,
      userId,
      sessionId: scope.sessionId,
      groupSessionId: scope.groupSessionId,
    },
  });

  const groupHint = scope.groupSessionId
    ? '【说明】以下为群聊。消息标签为「用户」或助理 slug；只提炼用户侧长期事实，文案规范与单聊相同。\n'
    : '';
  const userPrompt = `${groupHint}<conversation>\n${transcript}\n</conversation>`;

  logger.info({
    event: 'llm.consolidation.request',
    jobId: job.id,
    characterId,
    model: env.LLM_MODEL,
    messageIds,
    messageCount: messageIds.length,
    transcript,
    promptId: 'memory-extraction',
    sessionId: scope.sessionId,
    groupSessionId: scope.groupSessionId,
  });

  try {
    const { output, text } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: consolidationOutputSchema }),
      instructions: systemPrompt,
      prompt: userPrompt,
      maxRetries: env.LLM_STRUCTURED_MAX_RETRIES,
    });

    await updateConsolidationJob(job.id, {
      progress: '正在解析模型输出...',
    });

    logger.info({
      event: 'llm.consolidation.response',
      jobId: job.id,
      characterId,
      model: env.LLM_MODEL,
      messageIds,
      response: text,
      output,
    });

    if (!output) {
      return { error: '模型输出格式无效，无法解析' };
    }

    return { parsed: mapConsolidationOutput(output) };
  } catch (err) {
    logger.warn({ event: 'llm.consolidation.failed', jobId: job.id, err }, '结构化输出生成失败');
    return { error: '模型输出格式无效，无法解析' };
  }
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

/** 将各角色的记忆写入 MySQL 与向量库，并标记对应消息为已整理。 */
async function persistConsolidation(
  job: ConsolidationJob,
  perCharMemories: Map<string, FinishedMemory[]>,
  consolidatedIds: string[],
  userId: string,
): Promise<void> {
  const inputs: {
    userId: string;
    characterId: string;
    text: string;
    type: FinishedMemory['type'];
    confidence: number;
  }[] = [];
  for (const [characterId, memories] of perCharMemories) {
    for (const memory of memories) {
      inputs.push({
        userId,
        characterId,
        text: memory.text,
        type: memory.type,
        confidence: memory.confidence,
      });
    }
  }
  const { mysqlRows, chromaRecords } = buildUserMemoryWritePayload(inputs, {
    isMaintained: false,
  });

  await updateConsolidationJob(job.id, { progress: `正在存储 ${mysqlRows.length} 条记忆...` });

  await prisma.$transaction(async (tx) => {
    await tx.message.updateMany({
      where: { id: { in: consolidatedIds } },
      data: {
        isConsolidated: true,
        consolidationJobId: job.id,
      },
    });
    await tx.userMemory.createMany({ data: mysqlRows });
  });

  await syncUserMemoriesToChroma(chromaRecords);
}

/* -------------------------------------------------------------------------- */
/* Per-character extraction helpers                                           */
/* -------------------------------------------------------------------------- */

interface PerCharacterResult {
  finishedMemories: FinishedMemory[];
  consolidatedIds: string[];
  deferredIds: string[];
  droppedInvalidIdTexts: string[];
}

/** 对当前角色执行一次提取，失败返回 null。 */
async function extractForCharacter(
  job: ConsolidationJob,
  transcript: string,
  messageIds: string[],
  userId: string,
  scope: { sessionId?: string; groupSessionId?: string },
  characterId: string,
): Promise<PerCharacterResult | null> {
  const extracted = await extractMemoriesFromTranscript(
    job,
    transcript,
    messageIds,
    userId,
    scope,
    characterId,
  );
  if ('error' in extracted) {
    logger.warn(
      {
        event: 'llm.consolidation.character.failed',
        jobId: job.id,
        characterId,
        error: extracted.error,
      },
      `[MemoryConsolidation] 角色 ${characterId} 提取失败`,
    );
    return null;
  }

  const { finishedMemories, consolidatedIds, deferredIds, droppedInvalidIdTexts } =
    validateAndMergeIds(extracted.parsed, messageIds);

  droppedInvalidIdTexts.forEach((memoryText) => {
    logger.warn(
      { memoryText, characterId },
      '[MemoryConsolidation] 丢弃含非法 source_message_ids 的记忆',
    );
  });

  return { finishedMemories, consolidatedIds, deferredIds, droppedInvalidIdTexts };
}

/** 从多角色结果中取最长的 consolidated 前缀。 */
function mergeConsolidatedIds(allResults: PerCharacterResult[]): string[] {
  return allResults.reduce<string[]>(
    (longest, result) =>
      result.consolidatedIds.length > longest.length ? result.consolidatedIds : longest,
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 记忆整理主流程：单聊按 session 提取；群聊对每个成员角色分别用各自 extract prompt 提取后各自写入。
 */
export async function runConsolidation(
  job: ConsolidationJob,
  params: RunConsolidationParams,
): Promise<void> {
  const { userId, sessionId, groupSessionId } = params;

  const scope = typeof groupSessionId === 'string' && sessionId === undefined
    ? { kind: 'group' as const, groupSessionId }
    : typeof sessionId === 'string' && groupSessionId === undefined
    ? { kind: 'session' as const, sessionId }
    : null;

  if (!scope) {
    await failJob(job, '须且仅能指定 sessionId 或 groupSessionId 之一');
    return;
  }

  const isGroup = scope.kind === 'group';
  const scopeSnapshot = isGroup
    ? { userId, groupSessionId: scope.groupSessionId }
    : { userId, sessionId: scope.sessionId };

  await updateConsolidationJob(job.id, {
    status: 'running',
    progress: isGroup ? '正在读取未整理的群聊消息...' : '正在读取未整理的会话消息...',
    snapshot: scopeSnapshot,
  });

  try {
    const transcriptResult = isGroup
      ? await buildGroupTranscript(scope.groupSessionId)
      : await buildSessionTranscript(scope.sessionId);

    if (!transcriptResult) {
      await completeJob(job, '没有可整理的未整理消息。', emptyResult());
      return;
    }

    const { transcript, messageIds } = transcriptResult;

    if (!transcript) {
      await completeJob(
        job,
        `${messageIds.length} 条消息无有效文本，未做任何标记。`,
        emptyResult(),
        { messageIds, ...scopeSnapshot },
      );
      return;
    }

    const characterIds = isGroup
      ? await loadGroupMemberCharacterIds(scope.groupSessionId)
      : [await loadSessionCharacterId(scope.sessionId)].flatMap((id) => (id ? [id] : []));

    if (characterIds.length === 0) {
      await failJob(
        job,
        isGroup ? '群内无成员，无法写入记忆' : '会话角色不存在，无法写入记忆',
      );
      return;
    }

    const extractScope = {
      sessionId: isGroup ? undefined : scope.sessionId,
      groupSessionId: isGroup ? scope.groupSessionId : undefined,
    };

    const perCharMemories = new Map<string, FinishedMemory[]>();
    const results: PerCharacterResult[] = [];

    for (const characterId of characterIds) {
      const charLabel = isGroup ? `角色 ${characterId}` : '';
      await updateConsolidationJob(job.id, {
        progress: `正在${charLabel}提取记忆（${messageIds.length} 条消息）...`,
      });

      const result = await extractForCharacter(
        job,
        transcript,
        messageIds,
        userId,
        extractScope,
        characterId,
      );
      if (result) {
        results.push(result);
        if (result.finishedMemories.length > 0) {
          perCharMemories.set(characterId, result.finishedMemories);
        }
      }
    }

    if (results.length === 0) {
      await failJob(job, '所有角色提取均失败');
      return;
    }

    const mergedConsolidatedIds = mergeConsolidatedIds(results);
    const mergedDeferredIds = messageIds.slice(mergedConsolidatedIds.length);

    if (mergedConsolidatedIds.length > 0) {
      logger.info(
        {
          event: 'llm.consolidation.mark',
          globalMax: mergedConsolidatedIds.length - 1,
          consolidatedCount: mergedConsolidatedIds.length,
          deferredCount: mergedDeferredIds.length,
        },
        '[MemoryConsolidation] globalMax 前缀标记',
      );
    }

    const totalMemories = Array.from(perCharMemories.values()).reduce(
      (sum, memories) => sum + memories.length,
      0,
    );

    if (totalMemories === 0) {
      await completeJob(
        job,
        `未提取到已完结记忆，${mergedDeferredIds.length} 条消息留待下次。`,
        emptyResult(mergedDeferredIds.length),
      );
      return;
    }

    if (mergedConsolidatedIds.length === 0) {
      await completeJob(
        job,
        `提取到 ${totalMemories} 条记忆但无有效消息可标记，${mergedDeferredIds.length} 条留待下次。`,
        {
          memoriesExtracted: totalMemories,
          memories: Array.from(perCharMemories.values()).flatMap(toJobMemories),
          consolidatedMessageCount: 0,
          unfinishedMessageCount: mergedDeferredIds.length,
        },
      );
      return;
    }

    await persistConsolidation(job, perCharMemories, mergedConsolidatedIds, userId);

    const rowCount = Array.from(perCharMemories.values()).reduce(
      (sum, memories) => sum + memories.length,
      0,
    );

    const result = {
      memoriesExtracted: totalMemories,
      memories: Array.from(perCharMemories.values()).flatMap(toJobMemories),
      consolidatedMessageCount: mergedConsolidatedIds.length,
      unfinishedMessageCount: mergedDeferredIds.length,
    };

    logger.info({
      event: 'llm.consolidation.complete',
      jobId: job.id,
      sessionId: isGroup ? undefined : scope.sessionId,
      groupSessionId: isGroup ? scope.groupSessionId : undefined,
      characterIds,
      memoriesExtracted: result.memoriesExtracted,
      memoryRowsWritten: rowCount,
      consolidatedMessageCount: result.consolidatedMessageCount,
      unfinishedMessageCount: result.unfinishedMessageCount,
      memories: result.memories,
    });

    const perCharNote = isGroup
      ? `，${characterIds.length} 个角色各自提取，共写入 ${rowCount} 条`
      : '';

    await completeJob(
      job,
      `完成！提取 ${totalMemories} 条记忆${perCharNote}，标记 ${mergedConsolidatedIds.length} 条消息已整理，${mergedDeferredIds.length} 条消息留待下次。`,
      result,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    logger.error(
      {
        err,
        sessionId: isGroup ? undefined : scope.sessionId,
        groupSessionId: isGroup ? scope.groupSessionId : undefined,
        userId,
      },
      '[MemoryConsolidation] 记忆整理失败',
    );
    await failJob(job, errorMessage);
  }
}
