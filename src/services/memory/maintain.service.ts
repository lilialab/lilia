import { env } from '@/lib/server/env';
import { getChatModel } from '@/lib/server/llm';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { readJobPrompt } from '@/prompts/load';
import { isMemoryType, type MemoryType } from '@/types/memory';
import type { MaintainJobResult, MaintainMergedGroup, MemoryJob } from '@/types/memory-job';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { updateMemoryJob } from './job.service';
import {
  buildMaintainClusterDeleteIds,
  buildMaintainPrompt,
  isMaintainNeighborActive,
  type MaintainClusterNeighbor,
  type MaintainMemoryItem,
  mapMaintainRewriteOutput,
  validateMaintainRewriteOutput,
} from './maintain.utils';
import { applyMaintainMerge, markMemoryMaintained } from './memory-lifecycle.service';
import { VectorService } from './vector.service';

const vectorService = new VectorService();

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

const maintainOutputSchema = z.object({
  memories: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['event', 'fact']),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export type MaintainOutput = z.infer<typeof maintainOutputSchema>;

export interface MaintainModelResult {
  systemPrompt: string;
  userPrompt: string;
  output: MaintainOutput | undefined;
  text: string;
  error: string | undefined;
}

interface MemoryCursor {
  id: string;
  userId: string;
  characterId: string;
  text: string;
  type: MemoryType;
  confidence: number;
}

interface NeighborMemory extends MemoryCursor {
  lastActiveAt: Date;
}

interface NeighborCandidate extends NeighborMemory {
  distance: number;
}

interface MaintainOneResult {
  processed: boolean;
  merged: boolean;
  mergedGroup?: MaintainMergedGroup;
  maintainDeletedIds: string[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 捞下一条待维护游标（未删除且 isMaintained=false）。
 */
async function findNextUnmaintainedMemory(
  userId: string,
  characterId: string,
): Promise<MemoryCursor | null> {
  const row = await prisma.userMemory.findFirst({
    where: {
      userId,
      characterId,
      isDeleted: false,
      isMaintained: false,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      characterId: true,
      text: true,
      type: true,
      confidence: true,
    },
  });

  if (!row || !isMemoryType(row.type)) return null;

  return {
    id: row.id,
    userId: row.userId,
    characterId: row.characterId,
    text: row.text,
    type: row.type,
    confidence: row.confidence,
  };
}

/**
 * 近邻 id 来自 Chroma 语义召回；详情与活跃态以 MySQL 为准。
 * 软删为 MySQL + Chroma 双写且非原子（见 softDeleteMemories / applyMaintainMerge），
 * Chroma 可能仍命中已软删 id，此处用 isDeleted=false 做防御性过滤（与 queryMemoryWithDecay 一致）。
 * 不过滤 isMaintained（已维护老记忆仍可作合并近邻）；衰减过滤在 maintainOneMemory 另行处理。
 */
async function loadActiveMemoriesByIds(
  userId: string,
  characterId: string,
  ids: string[],
): Promise<NeighborMemory[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.userMemory.findMany({
    where: {
      userId,
      characterId,
      isDeleted: false,
      id: { in: ids },
    },
    select: {
      id: true,
      userId: true,
      characterId: true,
      text: true,
      type: true,
      confidence: true,
      lastActiveAt: true,
    },
  });

  return rows.flatMap((row) => {
    if (!isMemoryType(row.type)) return [];
    return [
      {
        id: row.id,
        userId: row.userId,
        characterId: row.characterId,
        text: row.text,
        type: row.type,
        confidence: row.confidence,
        lastActiveAt: row.lastActiveAt,
      },
    ];
  });
}

/** 无近邻时 1→1 touch 的产出：内容与游标相同，由删旧建新刷新 isMaintained 与向量。 */
function buildCursorTouchMemories(cursor: MemoryCursor): MaintainMemoryItem[] {
  return [
    {
      text: cursor.text,
      type: cursor.type,
      confidence: cursor.confidence,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

/** 按全局 maintain prompt 调用整理模型；失败时 error 有值，不抛。 */
export async function generateMaintainModelOutput(
  cursor: MaintainMemoryItem,
  neighbors: MaintainClusterNeighbor[],
): Promise<MaintainModelResult> {
  const systemPrompt = readJobPrompt('maintain');
  const userPrompt = buildMaintainPrompt(cursor, neighbors);

  try {
    const { output, text } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: maintainOutputSchema }),
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
        error: '维护模型输出格式无效',
      };
    }

    return { systemPrompt, userPrompt, output, text, error: undefined };
  } catch (err) {
    logger.warn({ event: 'llm.maintain.merge.failed', err }, '记忆维护失败');
    return {
      systemPrompt,
      userPrompt,
      output: undefined,
      text: '',
      error: '维护模型输出格式无效',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Cluster rewrite                                                            */
/* -------------------------------------------------------------------------- */

/**
 * 对输入簇执行删旧建新：deleteIds 固定为游标+近邻，newMemories 由 LLM 或无近邻 touch 提供。
 */
async function applyClusterRewrite(
  cursor: MemoryCursor,
  neighbors: NeighborCandidate[],
  memories: MaintainMemoryItem[],
): Promise<MaintainOneResult> {
  const deleteIds = buildMaintainClusterDeleteIds(
    cursor.id,
    neighbors.map((neighbor) => neighbor.id),
  );

  const { ids: newMemoryIds } = await applyMaintainMerge({
    deleteIds,
    newMemories: memories.map((memory) => ({
      userId: cursor.userId,
      characterId: cursor.characterId,
      text: memory.text,
      type: memory.type,
      confidence: memory.confidence,
    })),
  });

  const outputs = memories.map(({ text, type, confidence }) => ({
    text,
    type,
    confidence,
  }));

  const mergedGroup: MaintainMergedGroup = {
    newMemoryIds,
    outputs,
    deletedIds: deleteIds,
  };

  return {
    processed: true,
    merged: true,
    mergedGroup,
    maintainDeletedIds: deleteIds,
  };
}

/** 有近邻时调用 LLM：语义合并/拆分由模型决定，删谁由代码在 applyClusterRewrite 侧固定。 */
async function decideMaintainRewrite(
  job: MemoryJob,
  cursor: MemoryCursor,
  neighbors: NeighborCandidate[],
): Promise<{ ok: true; memories: MaintainMemoryItem[] } | { ok: false; error: string }> {
  const inputCount = 1 + neighbors.length;

  logger.info({
    event: 'llm.maintain.merge.request',
    jobId: job.id,
    model: env.LLM_MODEL,
    cursorId: cursor.id,
    neighborCount: neighbors.length,
    inputCount,
    prompt: buildMaintainPrompt(cursor, neighbors),
  });

  const { output, text, error } = await generateMaintainModelOutput(cursor, neighbors);

  logger.info({
    event: 'llm.maintain.merge.response',
    jobId: job.id,
    model: env.LLM_MODEL,
    response: text,
    output,
  });

  if (error || !output) {
    return { ok: false, error: error ?? '维护模型输出格式无效' };
  }

  const memories = mapMaintainRewriteOutput(output);
  const validation = validateMaintainRewriteOutput(memories, inputCount);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return { ok: true, memories };
}

/* -------------------------------------------------------------------------- */
/* One memory                                                  */
/* -------------------------------------------------------------------------- */

/** 维护单条游标：有近邻则 LLM 整理，无近邻则直接 touch。 */
async function maintainOneMemory(
  job: MemoryJob,
  cursor: MemoryCursor,
): Promise<MaintainOneResult> {
  const chromaNeighbors = await vectorService.findMemoryNeighbors(
    cursor.text,
    env.MEMORY_MAINTAIN_NEIGHBOR_LIMIT,
    { userId: cursor.userId, characterId: cursor.characterId, excludeId: cursor.id },
  );

  const neighborMemories = await loadActiveMemoriesByIds(
    cursor.userId,
    cursor.characterId,
    chromaNeighbors.map((neighbor) => neighbor.id),
  );

  const distanceById = new Map(chromaNeighbors.map((neighbor) => [neighbor.id, neighbor.distance]));
  const nowMs = Date.now();
  const neighbors: NeighborCandidate[] = neighborMemories.flatMap((memory) => {
    if (!isMaintainNeighborActive(memory.lastActiveAt.getTime(), nowMs, memory.type)) {
      return [];
    }
    return [
      {
        ...memory,
        distance: distanceById.get(memory.id) ?? 1,
      },
    ];
  });

  const droppedNeighborCount = neighborMemories.length - neighbors.length;
  if (droppedNeighborCount > 0) {
    logger.info(
      {
        event: 'llm.maintain.neighbor.decay_filtered',
        jobId: job.id,
        cursorId: cursor.id,
        droppedNeighborCount,
        keptNeighborCount: neighbors.length,
      },
      '[MemoryMaintain] 近邻因衰减过低已丢弃',
    );
  }

  // 无近邻：1→1 删旧建新 touch，不调 LLM
  if (neighbors.length === 0) {
    return applyClusterRewrite(cursor, neighbors, buildCursorTouchMemories(cursor));
  }

  const decision = await decideMaintainRewrite(job, cursor, neighbors);

  if (!decision.ok) {
    logger.warn(
      { jobId: job.id, cursorId: cursor.id, error: decision.error },
      '[MemoryMaintain] 跳过维护失败的游标',
    );
    // 失败时仍标记已消费，避免同一条游标无限重试
    await markMemoryMaintained(cursor.id);
    return { processed: true, merged: false, maintainDeletedIds: [] };
  }

  return applyClusterRewrite(cursor, neighbors, decision.memories);
}

/* -------------------------------------------------------------------------- */
/* Maintain loop                                                           */
/* -------------------------------------------------------------------------- */

/** 串行消费维护游标队列，直至无 isMaintained=false 候选。 */
async function runMaintainLoop(
  job: MemoryJob,
  userId: string,
  characterId: string,
): Promise<{
  processedCount: number;
  mergedGroups: MaintainMergedGroup[];
  maintainDeletedIds: string[];
}> {
  let processedCount = 0;
  const mergedGroups: MaintainMergedGroup[] = [];
  const maintainDeletedIds: string[] = [];

  while (true) {
    const cursor = await findNextUnmaintainedMemory(userId, characterId);
    if (!cursor) break;

    processedCount += 1;
    await updateMemoryJob(job.id, {
      progress: `正在维护第 ${processedCount} 条记忆...`,
    });

    const result = await maintainOneMemory(job, cursor);
    if (result.mergedGroup) {
      mergedGroups.push(result.mergedGroup);
    }
    maintainDeletedIds.push(...result.maintainDeletedIds);
  }

  return { processedCount, mergedGroups, maintainDeletedIds };
}

/** 写入维护任务完成状态与结果。 */
async function completeMaintainJob(
  job: MemoryJob,
  result: MaintainJobResult,
): Promise<void> {
  logger.info({
    event: 'llm.maintain.complete',
    jobId: job.id,
    ...result,
  });

  const progress = result.mergedCount + result.deletedCount === 0
    ? result.processedCount === 0
      ? '维护完成：无待维护记忆。'
      : '维护完成：无记忆需整理。'
    : `维护完成：处理 ${result.processedCount} 条游标，整理 ${result.mergedCount} 批，软删 ${result.deletedCount} 条。`;

  await updateMemoryJob(job.id, {
    status: 'completed',
    completedAt: Date.now(),
    progress,
    result,
  });
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 串行记忆维护：逐条游标整理（LLM 或 touch），范围限定 userId + characterId。 */
export async function runMaintain(
  job: MemoryJob,
  userId: string,
  characterId: string,
): Promise<void> {
  await updateMemoryJob(job.id, {
    status: 'running',
    progress: '正在查找待维护记忆...',
    snapshot: { userId, characterId },
  });

  try {
    const { processedCount, mergedGroups, maintainDeletedIds } = await runMaintainLoop(
      job,
      userId,
      characterId,
    );

    await completeMaintainJob(job, {
      processedCount,
      mergedCount: mergedGroups.length,
      deletedCount: maintainDeletedIds.length,
      mergedGroups,
      deletedIds: maintainDeletedIds,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    logger.error({ err, userId, characterId }, '[MemoryMaintain] 记忆维护失败');
    await updateMemoryJob(job.id, {
      status: 'failed',
      completedAt: Date.now(),
      progress: '记忆维护失败，可稍后重试。',
      error: errorMessage,
    });
  }
}
