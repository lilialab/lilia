import { generateText, Output } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { getStructuredOllamaModel } from '@/lib/server/ollama';
import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { VectorService } from './vector.service';
import { updateConsolidationJob } from './job.service';
import { applyMaintenanceMerge, markMemoryMaintained } from './memory-lifecycle.service';
import {
  buildMaintenanceClusterDeleteIds,
  mapMaintenanceRewriteOutput,
  validateMaintenanceRewriteOutput,
  type MaintenanceMemoryItem,
} from './maintenance.utils';
import { getLastMaintainedAt, updateLastMaintainedAt } from './user-profile.service';
import type {
  ConsolidationJob,
  MaintenanceJobResult,
  MaintenanceMergedGroup,
} from '@/types/consolidation-job';
import { isMemoryType, type MemoryType } from '@/types/memory';

const vectorService = new VectorService();
const DEFAULT_USER_ID = 'default';
const NEIGHBOR_LIMIT = 10;

const MEMORY_MAINTENANCE_PROMPT = `
你是记忆库维护专家。给定一条待维护记忆（游标，序号 1）及其 Chroma 近邻（若有），整理该组记忆并输出整理后的条目列表。

【输出要求】
1. 以序号 1（游标）为主：将与游标语义重复或近义的近邻合并为更少条；无法与游标合并的，单独输出并保留原意。
2. 输出 memories 数组：至少 1 条，至多等于输入条数。
3. text：第三人称「用户」表述，保留关键信息，去除重复与矛盾细节。
4. type：preference | event | fact。
5. confidence：0~1，综合各条置信度，略偏向较高值。
6. 禁止编造；禁止无故丢弃输入中的独立事实。
`.trim();

const maintenanceOutputSchema = z.object({
  memories: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['preference', 'event', 'fact']),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

interface MemoryCursor {
  id: string;
  userId: string;
  text: string;
  type: MemoryType;
  confidence: number;
}

interface NeighborCandidate extends MemoryCursor {
  distance: number;
}

interface MaintainOneResult {
  processed: boolean;
  merged: boolean;
  mergedGroup?: MaintenanceMergedGroup;
  maintenanceDeletedIds: string[];
}

/**
 * 捞下一条待维护游标。
 * isMaintained：条级防重试；lastMaintainedAt（createdAfter）：水位限本批时间范围，二者配合。
 */
async function findNextUnmaintainedMemory(
  userId: string,
  createdAfter: Date | null,
): Promise<MemoryCursor | null> {
  const row = await prisma.userMemory.findFirst({
    where: {
      userId,
      isDeleted: false,
      isMaintained: false,
      ...(createdAfter ? { createdAt: { gt: createdAfter } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      text: true,
      type: true,
      confidence: true,
    },
  });

  if (!row || !isMemoryType(row.type)) return null;

  return {
    id: row.id,
    userId: row.userId,
    text: row.text,
    type: row.type,
    confidence: row.confidence,
  };
}

/**
 * 近邻详情以 MySQL 为准：只排除 isDeleted，不过滤 isMaintained（老记忆可作合并对象）。
 * Chroma 返回的 id 若已软删或不存在，此处自然滤掉。
 */
async function loadActiveMemoriesByIds(userId: string, ids: string[]): Promise<MemoryCursor[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.userMemory.findMany({
    where: { userId, isDeleted: false, id: { in: ids } },
    select: {
      id: true,
      userId: true,
      text: true,
      type: true,
      confidence: true,
    },
  });

  return rows.flatMap((row) => {
    if (!isMemoryType(row.type)) return [];
    return [
      {
        id: row.id,
        userId: row.userId,
        text: row.text,
        type: row.type,
        confidence: row.confidence,
      },
    ];
  });
}

/** 组装游标 + 近邻的 LLM 用户 prompt（序号 1 为游标）。 */
function buildMaintenancePrompt(cursor: MemoryCursor, neighbors: NeighborCandidate[]): string {
  const lines = [
    `1. [cursor, ${cursor.type}, confidence=${cursor.confidence.toFixed(2)}] ${cursor.text}`,
  ];

  neighbors.forEach((neighbor, index) => {
    lines.push(
      `${index + 2}. [neighbor, distance=${neighbor.distance.toFixed(3)}, ${neighbor.type}, confidence=${neighbor.confidence.toFixed(2)}] ${neighbor.text}`,
    );
  });

  return lines.join('\n');
}

/** 无近邻时 1→1 touch 的产出：内容与游标相同，由删旧建新刷新 isMaintained 与向量。 */
function buildCursorTouchMemories(cursor: MemoryCursor): MaintenanceMemoryItem[] {
  return [
    {
      text: cursor.text,
      type: cursor.type,
      confidence: cursor.confidence,
    },
  ];
}

/**
 * 对输入簇执行删旧建新：deleteIds 固定为游标+近邻，newMemories 由 LLM 或无近邻 touch 提供。
 */
async function applyClusterRewrite(
  cursor: MemoryCursor,
  neighbors: NeighborCandidate[],
  memories: MaintenanceMemoryItem[],
): Promise<MaintainOneResult> {
  const deleteIds = buildMaintenanceClusterDeleteIds(
    cursor.id,
    neighbors.map((neighbor) => neighbor.id),
  );

  const { ids: newMemoryIds } = await applyMaintenanceMerge({
    deleteIds,
    newMemories: memories.map((memory) => ({
      userId: cursor.userId,
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

  const mergedGroup: MaintenanceMergedGroup = {
    newMemoryIds,
    outputs,
    deletedIds: deleteIds,
  };

  return {
    processed: true,
    merged: true,
    mergedGroup,
    maintenanceDeletedIds: deleteIds,
  };
}

/** 有近邻时调用 LLM：语义合并/拆分由模型决定，删谁由代码在 applyClusterRewrite 侧固定。 */
async function decideMaintenanceRewrite(
  job: ConsolidationJob,
  cursor: MemoryCursor,
  neighbors: NeighborCandidate[],
): Promise<{ ok: true; memories: MaintenanceMemoryItem[] } | { ok: false; error: string }> {
  const inputCount = 1 + neighbors.length;
  const userPrompt = buildMaintenancePrompt(cursor, neighbors);

  logger.info({
    event: 'llm.maintenance.merge.request',
    jobId: job.id,
    model: env.OLLAMA_MODEL,
    cursorId: cursor.id,
    neighborCount: neighbors.length,
    inputCount,
    prompt: userPrompt,
  });

  try {
    const { output, text } = await generateText({
      model: getStructuredOllamaModel(env.OLLAMA_MODEL),
      output: Output.object({ schema: maintenanceOutputSchema }),
      system: MEMORY_MAINTENANCE_PROMPT,
      prompt: userPrompt,
      maxRetries: 2,
    });

    logger.info({
      event: 'llm.maintenance.merge.response',
      jobId: job.id,
      model: env.OLLAMA_MODEL,
      response: text,
      output,
    });

    if (!output) {
      return { ok: false, error: '维护模型输出格式无效' };
    }

    const memories = mapMaintenanceRewriteOutput(output);
    const validation = validateMaintenanceRewriteOutput(memories, inputCount);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    return { ok: true, memories };
  } catch (err) {
    logger.warn({ event: 'llm.maintenance.merge.failed', jobId: job.id, err }, '记忆维护失败');
    return { ok: false, error: '维护模型输出格式无效' };
  }
}

/** 维护单条游标：有近邻则 LLM 整理，无近邻则直接 touch。 */
async function maintainOneMemory(
  job: ConsolidationJob,
  cursor: MemoryCursor,
): Promise<MaintainOneResult> {
  const chromaNeighbors = await vectorService.findMemoryNeighbors(
    cursor.text,
    NEIGHBOR_LIMIT,
    cursor.id,
  );

  const neighborMemories = await loadActiveMemoriesByIds(
    cursor.userId,
    chromaNeighbors.map((neighbor) => neighbor.id),
  );

  const distanceById = new Map(chromaNeighbors.map((neighbor) => [neighbor.id, neighbor.distance]));
  const neighbors: NeighborCandidate[] = neighborMemories.map((memory) => ({
    ...memory,
    distance: distanceById.get(memory.id) ?? 1,
  }));

  // 无近邻：1→1 删旧建新 touch，不调 LLM
  if (neighbors.length === 0) {
    return applyClusterRewrite(cursor, neighbors, buildCursorTouchMemories(cursor));
  }

  const decision = await decideMaintenanceRewrite(job, cursor, neighbors);

  if (!decision.ok) {
    logger.warn(
      { jobId: job.id, cursorId: cursor.id, error: decision.error },
      '[MemoryMaintenance] 跳过维护失败的游标',
    );
    // 兜底：标记已消费，避免同一条游标在失败时无限重试
    await markMemoryMaintained(cursor.id);
    return { processed: true, merged: false, maintenanceDeletedIds: [] };
  }

  return applyClusterRewrite(cursor, neighbors, decision.memories);
}

/** 串行消费维护游标队列，直至无 isMaintained=false 候选。 */
async function runMaintenanceLoop(
  job: ConsolidationJob,
  userId: string,
  createdAfter: Date | null,
): Promise<{
  processedCount: number;
  mergedGroups: MaintenanceMergedGroup[];
  maintenanceDeletedIds: string[];
}> {
  let processedCount = 0;
  const mergedGroups: MaintenanceMergedGroup[] = [];
  const maintenanceDeletedIds: string[] = [];

  while (true) {
    const cursor = await findNextUnmaintainedMemory(userId, createdAfter);
    if (!cursor) break;

    processedCount += 1;
    await updateConsolidationJob(job.id, {
      progress: `正在维护第 ${processedCount} 条记忆...`,
    });

    const result = await maintainOneMemory(job, cursor);
    if (result.mergedGroup) {
      mergedGroups.push(result.mergedGroup);
    }
    maintenanceDeletedIds.push(...result.maintenanceDeletedIds);
  }

  return { processedCount, mergedGroups, maintenanceDeletedIds };
}

/** 写入维护任务完成状态与结果。 */
async function completeMaintenanceJob(
  job: ConsolidationJob,
  result: MaintenanceJobResult,
): Promise<void> {
  logger.info({
    event: 'llm.maintenance.complete',
    jobId: job.id,
    ...result,
  });

  const progress =
    result.mergedCount + result.deletedCount === 0
      ? result.processedCount === 0
        ? '维护完成：无待维护记忆。'
        : '维护完成：无记忆需整理。'
      : `维护完成：处理 ${result.processedCount} 条游标，整理 ${result.mergedCount} 批，软删 ${result.deletedCount} 条。`;

  await updateConsolidationJob(job.id, {
    status: 'completed',
    completedAt: Date.now(),
    progress,
    result,
  });
}

/** 串行记忆维护：逐条游标整理（LLM 或 touch）。 */
export async function runMaintenance(job: ConsolidationJob): Promise<void> {
  const userId = DEFAULT_USER_ID;

  await updateConsolidationJob(job.id, {
    status: 'running',
    progress: '正在查找待维护记忆...',
    snapshot: { userId },
  });

  try {
    const lastMaintainedAt = await getLastMaintainedAt(userId);

    const { processedCount, mergedGroups, maintenanceDeletedIds } = await runMaintenanceLoop(
      job,
      userId,
      lastMaintainedAt,
    );

    const completedAt = new Date();
    await updateLastMaintainedAt(userId, completedAt);

    await completeMaintenanceJob(job, {
      processedCount,
      mergedCount: mergedGroups.length,
      deletedCount: maintenanceDeletedIds.length,
      mergedGroups,
      deletedIds: maintenanceDeletedIds,
      lastMaintainedAt: completedAt.getTime(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    logger.error({ err }, '[MemoryMaintenance] 记忆维护失败');
    await updateConsolidationJob(job.id, {
      status: 'failed',
      completedAt: Date.now(),
      progress: '记忆维护失败，可稍后重试。',
      error: errorMessage,
    });
  }
}
