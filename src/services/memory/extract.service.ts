import { env } from '@/lib/server/env';
import { getChatModel } from '@/lib/server/llm';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { readCharacterJobPrompt, readPromptFile } from '@/prompts/load';
import type { ExtractedMemory, ExtractJobResult, MemoryJob } from '@/types/memory-job';
import { formatLocalDateTime } from '@/utils/timezone';
import { xmlBlock } from '@/utils/xml-block';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import {
  type ExtractParseResult,
  extractSpeaker,
  type FinishedMemory,
  formatExtractMessageXml,
  isIncludedInGroupExtract,
  mapExtractOutput,
  textFromMessageParts,
  validateAndMergeIds,
} from './extract.utils';
import { updateMemoryJob } from './job.service';
import { buildUserMemoryWritePayload, syncUserMemoriesToChroma } from './memory-lifecycle.service';

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

interface TranscriptResult {
  transcript: string;
  messageIds: string[];
}

interface ExtractTarget {
  characterId: string;
  characterSlug: string;
}

export type RunExtractParams = {
  userId: string;
  sessionId?: string;
  groupSessionId?: string;
};

const extractOutputSchema = z.object({
  finished_memories: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['event', 'fact']),
      source_message_ids: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export type ExtractOutput = z.infer<typeof extractOutputSchema>;

export interface ExtractModelResult {
  systemPrompt: string;
  userPrompt: string;
  output: ExtractOutput | undefined;
  text: string;
  error: string | undefined;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 将内部记忆结构转换为 job 结果中的精简格式。 */
function toJobMemories(memories: FinishedMemory[]): ExtractedMemory[] {
  return memories.map(({ text, type, confidence }) => ({ text, type, confidence }));
}

/** 构造空的提取结果（无可提取记忆、无已标记消息）。 */
function emptyResult(deferredMessageCount = 0): ExtractJobResult {
  return {
    memoriesExtracted: 0,
    memories: [],
    extractedMessageCount: 0,
    unfinishedMessageCount: deferredMessageCount,
  };
}

/** 将 job 标记为已完成并写入进度与结果。 */
function completeJob(
  job: MemoryJob,
  progress: string,
  result: ExtractJobResult,
  snapshot?: MemoryJob['snapshot'],
): Promise<void> {
  return updateMemoryJob(job.id, {
    status: 'completed',
    completedAt: Date.now(),
    progress,
    result,
    snapshot,
  });
}

/** 将 job 标记为失败并记录错误信息。 */
function failJob(job: MemoryJob, errorMessage: string): Promise<void> {
  return updateMemoryJob(job.id, {
    status: 'failed',
    completedAt: Date.now(),
    progress: '记忆提取失败，可稍后重试。',
    error: errorMessage,
  });
}

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

function buildExtractSystemPrompt(characterSlug: string): string {
  return [
    xmlBlock('extract_rules', readPromptFile('jobs', 'extract.md')),
    xmlBlock('character_extract_focus', readCharacterJobPrompt(characterSlug, 'extract')),
  ].join('\n\n');
}

function buildExtractUserPrompt(transcript: string): string {
  return xmlBlock('conversation', transcript);
}

/** 按角色焦点调用提取模型；失败时 error 有值，不抛。 */
export async function generateExtractModelOutput(
  characterSlug: string,
  transcript: string,
): Promise<ExtractModelResult> {
  const systemPrompt = buildExtractSystemPrompt(characterSlug);
  const userPrompt = buildExtractUserPrompt(transcript);

  try {
    const { output, text } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: extractOutputSchema }),
      instructions: systemPrompt,
      prompt: userPrompt,
      maxRetries: env.LLM_STRUCTURED_MAX_RETRIES,
    });

    if (!output) {
      return {
        systemPrompt,
        userPrompt,
        output: undefined,
        text,
        error: '模型输出格式无效，无法解析',
      };
    }

    return { systemPrompt, userPrompt, output, text, error: undefined };
  } catch (err) {
    logger.warn({ event: 'llm.extract.failed', err, characterSlug }, '结构化输出生成失败');
    return {
      systemPrompt,
      userPrompt,
      output: undefined,
      text: '',
      error: '模型输出格式无效，无法解析',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Transcript                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 捞取指定单聊会话未提取的消息，按时间正序构建带 id + seq + local_time 的 XML transcript。
 */
async function buildSessionTranscript(
  sessionId: string,
  timeZone: string,
): Promise<TranscriptResult | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { character: { select: { slug: true } } },
  });
  const assistantSlug = session?.character.slug;

  const messages = await prisma.message.findMany({
    where: {
      isExtracted: false,
      sessionId,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      parts: true,
      createdAt: true,
    },
  });

  if (messages.length === 0) return null;

  const messageIds = messages.map((message) => message.id);
  const lines = messages.flatMap((message, seq) => {
    const speaker = extractSpeaker(message.role, assistantSlug);
    const localTime = formatLocalDateTime(message.createdAt, timeZone);
    const line = formatExtractMessageXml(
      message.id,
      seq,
      speaker,
      textFromMessageParts(message.parts),
      localTime,
    );
    return line === null ? [] : [line];
  });

  return {
    transcript: lines.join('\n'),
    messageIds,
  };
}

/**
 * 捞取群聊未提取消息（排除 turn_cue），助理标签用 speaker slug。
 */
async function buildGroupTranscript(
  groupSessionId: string,
  timeZone: string,
): Promise<TranscriptResult | null> {
  const messages = await prisma.message.findMany({
    where: {
      isExtracted: false,
      groupSessionId,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      kind: true,
      parts: true,
      createdAt: true,
      speakerCharacter: { select: { slug: true } },
    },
  });

  const included = messages.filter((message) => isIncludedInGroupExtract(message.kind));
  if (included.length === 0) return null;

  const messageIds = included.map((message) => message.id);
  const lines = included.flatMap((message, seq) => {
    const speaker = extractSpeaker(message.role, message.speakerCharacter?.slug);
    const localTime = formatLocalDateTime(message.createdAt, timeZone);
    const line = formatExtractMessageXml(
      message.id,
      seq,
      speaker,
      textFromMessageParts(message.parts),
      localTime,
    );
    return line === null ? [] : [line];
  });

  return {
    transcript: lines.join('\n'),
    messageIds,
  };
}

/** 读取群当前成员（job 执行时快照；id 落库，slug 读角色 jobs/extract.md）。 */
async function loadGroupMemberCharacters(groupSessionId: string): Promise<ExtractTarget[]> {
  const members = await prisma.groupMember.findMany({
    where: { groupSessionId },
    select: { characterId: true, character: { select: { slug: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return members.map((member) => ({
    characterId: member.characterId,
    characterSlug: member.character.slug,
  }));
}

/** 单聊会话的角色 id 与 slug。 */
async function loadSessionCharacter(sessionId: string): Promise<ExtractTarget | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { characterId: true, character: { select: { slug: true } } },
  });
  if (!session) return null;
  return { characterId: session.characterId, characterSlug: session.character.slug };
}

/* -------------------------------------------------------------------------- */
/* Extraction                                                                 */
/* -------------------------------------------------------------------------- */

/** 调用模型从 transcript 提取记忆，LLM 上下文写入 Loki，job snapshot 仅保留 messageIds/userId。 */
async function extractMemoriesFromTranscript(
  job: MemoryJob,
  transcript: string,
  messageIds: string[],
  userId: string,
  scope: { sessionId?: string; groupSessionId?: string },
  characterId: string,
  characterSlug: string,
): Promise<{ parsed: ExtractParseResult } | { error: string }> {
  await updateMemoryJob(job.id, {
    progress: `正在调用模型提取记忆（${messageIds.length} 条消息）...`,
    snapshot: {
      messageIds,
      userId,
      sessionId: scope.sessionId,
      groupSessionId: scope.groupSessionId,
    },
  });

  logger.info({
    event: 'llm.extract.request',
    jobId: job.id,
    characterId,
    characterSlug,
    model: env.LLM_MODEL,
    messageIds,
    messageCount: messageIds.length,
    transcript,
    promptId: 'memory-extraction',
    sessionId: scope.sessionId,
    groupSessionId: scope.groupSessionId,
  });

  const { output, text, error } = await generateExtractModelOutput(characterSlug, transcript);

  await updateMemoryJob(job.id, {
    progress: '正在解析模型输出...',
  });

  logger.info({
    event: 'llm.extract.response',
    jobId: job.id,
    characterId,
    characterSlug,
    model: env.LLM_MODEL,
    messageIds,
    response: text,
    output,
  });

  if (error || !output) {
    return { error: error ?? '模型输出格式无效，无法解析' };
  }

  return { parsed: mapExtractOutput(output) };
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

/** 将各角色的记忆写入 MySQL 与向量库，并标记对应消息为已提取。 */
async function persistExtract(
  job: MemoryJob,
  perCharMemories: Map<string, FinishedMemory[]>,
  extractedIds: string[],
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

  await updateMemoryJob(job.id, { progress: `正在存储 ${mysqlRows.length} 条记忆...` });

  await prisma.$transaction(async (tx) => {
    await tx.message.updateMany({
      where: { id: { in: extractedIds } },
      data: {
        isExtracted: true,
        extractJobId: job.id,
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
  extractedIds: string[];
  deferredIds: string[];
  droppedInvalidIdTexts: string[];
}

/** 对当前角色执行一次提取，失败返回 null。 */
async function extractForCharacter(
  job: MemoryJob,
  transcript: string,
  messageIds: string[],
  userId: string,
  scope: { sessionId?: string; groupSessionId?: string },
  characterId: string,
  characterSlug: string,
): Promise<PerCharacterResult | null> {
  const extracted = await extractMemoriesFromTranscript(
    job,
    transcript,
    messageIds,
    userId,
    scope,
    characterId,
    characterSlug,
  );
  if ('error' in extracted) {
    logger.warn(
      {
        event: 'llm.extract.character.failed',
        jobId: job.id,
        characterId,
        characterSlug,
        error: extracted.error,
      },
      `[MemoryExtract] 角色 ${characterSlug} 提取失败`,
    );
    return null;
  }

  const { finishedMemories, extractedIds, deferredIds, droppedInvalidIdTexts } =
    validateAndMergeIds(
      extracted.parsed,
      messageIds,
    );

  droppedInvalidIdTexts.forEach((memoryText) => {
    logger.warn(
      { memoryText, characterId },
      '[MemoryExtract] 丢弃含非法 source_message_ids 的记忆',
    );
  });

  return { finishedMemories, extractedIds, deferredIds, droppedInvalidIdTexts };
}

/** 从多角色结果中取最长的 extracted 前缀。 */
function mergeExtractedIds(allResults: PerCharacterResult[]): string[] {
  return allResults.reduce<string[]>(
    (longest, result) =>
      result.extractedIds.length > longest.length ? result.extractedIds : longest,
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 记忆提取主流程：单聊按 session 提取；群聊对每个成员角色分别用各自 extract prompt 提取后各自写入。
 */
export async function runExtract(
  job: MemoryJob,
  params: RunExtractParams,
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timeZone: true },
  });
  if (!user) {
    await failJob(job, '用户不存在');
    return;
  }
  const { timeZone } = user;

  const isGroup = scope.kind === 'group';
  const extractScope = {
    sessionId: isGroup ? undefined : scope.sessionId,
    groupSessionId: isGroup ? scope.groupSessionId : undefined,
  };
  const scopeSnapshot = { userId, ...extractScope };

  await updateMemoryJob(job.id, {
    status: 'running',
    progress: isGroup ? '正在读取未提取的群聊消息...' : '正在读取未提取的会话消息...',
    snapshot: scopeSnapshot,
  });

  try {
    const transcriptResult = isGroup
      ? await buildGroupTranscript(scope.groupSessionId, timeZone)
      : await buildSessionTranscript(scope.sessionId, timeZone);

    if (!transcriptResult) {
      await completeJob(job, '没有可提取的消息。', emptyResult());
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

    const characters = isGroup
      ? await loadGroupMemberCharacters(scope.groupSessionId)
      : [await loadSessionCharacter(scope.sessionId)].flatMap(
        (character) => character ? [character] : [],
      );

    if (characters.length === 0) {
      await failJob(
        job,
        isGroup ? '群内无成员，无法写入记忆' : '会话角色不存在，无法写入记忆',
      );
      return;
    }

    const perCharMemories = new Map<string, FinishedMemory[]>();
    const results: PerCharacterResult[] = [];

    for (const { characterId, characterSlug } of characters) {
      const charLabel = isGroup ? `角色 ${characterSlug}` : '';
      await updateMemoryJob(job.id, {
        progress: `正在${charLabel}提取记忆（${messageIds.length} 条消息）...`,
      });

      const result = await extractForCharacter(
        job,
        transcript,
        messageIds,
        userId,
        extractScope,
        characterId,
        characterSlug,
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

    const mergedExtractedIds = mergeExtractedIds(results);
    const mergedDeferredIds = messageIds.slice(mergedExtractedIds.length);

    if (mergedExtractedIds.length > 0) {
      logger.info(
        {
          event: 'llm.extract.mark',
          globalMax: mergedExtractedIds.length - 1,
          extractedCount: mergedExtractedIds.length,
          deferredCount: mergedDeferredIds.length,
        },
        '[MemoryExtract] globalMax 前缀标记',
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

    if (mergedExtractedIds.length === 0) {
      await completeJob(
        job,
        `提取到 ${totalMemories} 条记忆但无有效消息可标记，${mergedDeferredIds.length} 条留待下次。`,
        {
          memoriesExtracted: totalMemories,
          memories: Array.from(perCharMemories.values()).flatMap(toJobMemories),
          extractedMessageCount: 0,
          unfinishedMessageCount: mergedDeferredIds.length,
        },
      );
      return;
    }

    await persistExtract(job, perCharMemories, mergedExtractedIds, userId);

    const rowCount = Array.from(perCharMemories.values()).reduce(
      (sum, memories) => sum + memories.length,
      0,
    );

    const result: ExtractJobResult = {
      memoriesExtracted: totalMemories,
      memories: Array.from(perCharMemories.values()).flatMap(toJobMemories),
      extractedMessageCount: mergedExtractedIds.length,
      unfinishedMessageCount: mergedDeferredIds.length,
    };

    logger.info({
      event: 'llm.extract.complete',
      jobId: job.id,
      ...extractScope,
      characterIds: characters.map((character) => character.characterId),
      memoriesExtracted: result.memoriesExtracted,
      memoryRowsWritten: rowCount,
      extractedMessageCount: result.extractedMessageCount,
      unfinishedMessageCount: result.unfinishedMessageCount,
      memories: result.memories,
    });

    const perCharNote = isGroup
      ? `，${characters.length} 个角色各自提取，共写入 ${rowCount} 条`
      : '';

    await completeJob(
      job,
      `完成！提取 ${totalMemories} 条记忆${perCharNote}，标记 ${mergedExtractedIds.length} 条消息已提取，${mergedDeferredIds.length} 条消息留待下次。`,
      result,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    logger.error(
      {
        err,
        ...extractScope,
        userId,
      },
      '[MemoryExtract] 记忆提取失败',
    );
    await failJob(job, errorMessage);
  }
}
