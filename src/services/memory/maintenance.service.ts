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
  isMaintenanceNeighborActive,
  mapMaintenanceRewriteOutput,
  validateMaintenanceRewriteOutput,
  type MaintenanceMemoryItem,
} from './maintenance.utils';
import type {
  ConsolidationJob,
  MaintenanceJobResult,
  MaintenanceMergedGroup,
} from '@/types/consolidation-job';
import { isMemoryType, type MemoryType } from '@/types/memory';
import { loadJobPrompt } from '@/prompts/load';

const vectorService = new VectorService();

const MEMORY_MAINTENANCE_PROMPT = loadJobPrompt('maintain');

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

interface NeighborMemory extends MemoryCursor {
  lastActiveAt: Date;
}

interface NeighborCandidate extends NeighborMemory {
  distance: number;
}

interface MaintainOneResult {
  processed: boolean;
  merged: boolean;
  mergedGroup?: MaintenanceMergedGroup;
  maintenanceDeletedIds: string[];
}

/**
 * 捞下一条待维护游标（未删除且 isMaintained=false）。
 */
async function findNextUnmaintainedMemory(userId: string): Promise<MemoryCursor | null> {
  const row = await prisma.userMemory.findFirst({
    where: {
      userId,
      isDeleted: false,
      isMaintained: false,
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
 * 近邻 id 来自 Chroma 语义召回；详情与活跃态以 MySQL 为准。
 * 软删为 MySQL + Chroma 双写且非原子（见 softDeleteMemories / applyMaintenanceMerge），
 * Chroma 可能仍命中已软删 id，此处用 isDeleted=false 做防御性过滤（与 queryMemoryWithDecay 一致）。
 * 不过滤 isMaintained（已维护老记忆仍可作合并近邻）；衰减过滤在 maintainOneMemory 另行处理。
 */
async function loadActiveMemoriesByIds(userId: string, ids: string[]): Promise<NeighborMemory[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.userMemory.findMany({
    where: { userId, isDeleted: false, id: { in: ids } },
    select: {
      id: true,
      userId: true,
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
        text: row.text,
        type: row.type,
        confidence: row.confidence,
        lastActiveAt: row.lastActiveAt,
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
      maxRetries: env.LLM_STRUCTURED_MAX_RETRIES,
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
    env.MEMORY_MAINTENANCE_NEIGHBOR_LIMIT,
    { userId: cursor.userId, excludeId: cursor.id },
  );

  const neighborMemories = await loadActiveMemoriesByIds(
    cursor.userId,
    chromaNeighbors.map((neighbor) => neighbor.id),
  );

  const distanceById = new Map(chromaNeighbors.map((neighbor) => [neighbor.id, neighbor.distance]));
  const nowMs = Date.now();
  const neighbors: NeighborCandidate[] = neighborMemories.flatMap((memory) => {
    if (!isMaintenanceNeighborActive(memory.lastActiveAt.getTime(), nowMs, memory.type)) {
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
        event: 'llm.maintenance.neighbor.decay_filtered',
        jobId: job.id,
        cursorId: cursor.id,
        droppedNeighborCount,
        keptNeighborCount: neighbors.length,
      },
      '[MemoryMaintenance] 近邻因衰减过低已丢弃',
    );
  }

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
    // 失败时仍标记已消费，避免同一条游标无限重试
    await markMemoryMaintained(cursor.id);
    return { processed: true, merged: false, maintenanceDeletedIds: [] };
  }

  return applyClusterRewrite(cursor, neighbors, decision.memories);
}

/** 串行消费维护游标队列，直至无 isMaintained=false 候选。 */
async function runMaintenanceLoop(
  job: ConsolidationJob,
  userId: string,
): Promise<{
  processedCount: number;
  mergedGroups: MaintenanceMergedGroup[];
  maintenanceDeletedIds: string[];
}> {
  let processedCount = 0;
  const mergedGroups: MaintenanceMergedGroup[] = [];
  const maintenanceDeletedIds: string[] = [];

  while (true) {
    const cursor = await findNextUnmaintainedMemory(userId);
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
export async function runMaintenance(job: ConsolidationJob, userId: string): Promise<void> {
  await updateConsolidationJob(job.id, {
    status: 'running',
    progress: '正在查找待维护记忆...',
    snapshot: { userId },
  });

  try {
    const { processedCount, mergedGroups, maintenanceDeletedIds } = await runMaintenanceLoop(
      job,
      userId,
    );

    await completeMaintenanceJob(job, {
      processedCount,
      mergedCount: mergedGroups.length,
      deletedCount: maintenanceDeletedIds.length,
      mergedGroups,
      deletedIds: maintenanceDeletedIds,
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
