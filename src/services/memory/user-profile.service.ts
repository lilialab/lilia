import { env } from '@/lib/server/env';
import { logger } from '@/lib/server/logger';
import { getStructuredOllamaModel } from '@/lib/server/ollama';
import { prisma } from '@/lib/server/prisma';
import { loadJobPrompt } from '@/prompts/load';
import type { ConsolidationJob, ProfileJobResult } from '@/types/consolidation-job';
import { isMemoryType, type MemoryType } from '@/types/memory';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { updateConsolidationJob } from './job.service';

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

const EMPTY_PROFILE_TEXT = '目前暂无特殊偏好记录。';

const profileFacetsSchema = z.object({
  nickname: z.string().optional(),
  occupation: z.string().optional(),
  communication_style: z.string().optional(),
  avoid_topics: z.array(z.string()).optional(),
  active_goals: z.array(z.string()).optional(),
});

const profileOutputSchema = z.object({
  summary: z.string(),
  facets: profileFacetsSchema,
});

export type ProfileFacets = z.infer<typeof profileFacetsSchema>;

export interface ProfileMemoryStats {
  activeMemoryCount: number;
  byType: Record<MemoryType, number>;
}

const FACET_LABELS: Record<keyof ProfileFacets, string> = {
  nickname: '昵称',
  occupation: '职业',
  communication_style: '沟通风格',
  avoid_topics: '敏感话题',
  active_goals: '当前目标',
};

const PROFILE_REFRESH_PROMPT = loadJobPrompt('profile');

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 将 summary 与 facets 格式化为 prompt 可用的纯文本。 */
export function formatProfileForPrompt(
  summary: string | null | undefined,
  facets: ProfileFacets | null | undefined,
): string {
  const trimmedSummary = summary?.trim() ?? '';
  const facetLines = facets
    ? (Object.keys(FACET_LABELS) as (keyof ProfileFacets)[]).flatMap((key) => {
      const value = facets[key];
      if (value === null || value === undefined) return [];
      if (Array.isArray(value) && value.length === 0) return [];
      if (typeof value === 'string' && !value.trim()) return [];
      const display = Array.isArray(value) ? value.join('、') : value;
      return [`- ${FACET_LABELS[key]}：${display}`];
    })
    : [];

  if (!trimmedSummary && facetLines.length === 0) {
    return EMPTY_PROFILE_TEXT;
  }

  const parts: string[] = [];
  if (trimmedSummary) parts.push(trimmedSummary);
  if (facetLines.length > 0) {
    parts.push('结构化画像：');
    parts.push(...facetLines);
  }
  return parts.join('\n');
}

/** 将参考记忆列表格式化为 prompt 中的 bullet 文本。 */
function formatMemoryList(memories: { text: string; type: string; confidence: number }[]): string {
  if (memories.length === 0) return '（无）';
  return memories
    .map(
      (memory) => `- [${memory.type}, confidence=${memory.confidence.toFixed(2)}] ${memory.text}`,
    )
    .join('\n');
}

/** 将记忆库统计格式化为 prompt 中的多行文本。 */
function formatStats(stats: ProfileMemoryStats): string {
  return [
    `活跃记忆总数：${stats.activeMemoryCount}`,
    `preference：${stats.byType.preference}`,
    `event：${stats.byType.event}`,
    `fact：${stats.byType.fact}`,
  ].join('\n');
}

/** 组装画像刷新 prompt 正文（纯函数，便于单测）。 */
export function buildProfileRefreshPrompt(input: {
  existingSummary: string | null | undefined;
  existingFacets: ProfileFacets | undefined;
  referenceMemories: { text: string; type: string; confidence: number }[];
  stats: ProfileMemoryStats;
}): string {
  return [
    '【现有画像 summary】',
    input.existingSummary?.trim() || '（无）',
    '',
    '【现有 facets JSON】',
    JSON.stringify(input.existingFacets ?? {}, null, 2),
    '',
    '【参考记忆（高置信度与活跃度优先）】',
    formatMemoryList(input.referenceMemories),
    '',
    '【记忆库统计】',
    formatStats(input.stats),
  ].join('\n');
}

/* -------------------------------------------------------------------------- */
/* Profile refresh                                                            */
/* -------------------------------------------------------------------------- */

/** 从数据库读取该用户×角色画像并格式化为 prompt 文本。 */
export async function getUserProfileText(userId: string, characterId: string): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { summary: true, facets: true },
  });

  if (!profile) return EMPTY_PROFILE_TEXT;

  const facets = profile.facets ? profileFacetsSchema.safeParse(profile.facets).data : undefined;

  return formatProfileForPrompt(profile.summary, facets);
}

/** 统计该角色下活跃记忆数量与各类型分布。 */
async function loadMemoryStats(userId: string, characterId: string): Promise<ProfileMemoryStats> {
  const rows = await prisma.userMemory.groupBy({
    by: ['type'],
    where: { userId, characterId, isDeleted: false },
    _count: { id: true },
  });

  const byType: Record<MemoryType, number> = { preference: 0, event: 0, fact: 0 };
  rows.forEach((row) => {
    if (isMemoryType(row.type)) {
      byType[row.type] = row._count.id;
    }
  });

  const activeMemoryCount = Object.values(byType).reduce((sum, count) => sum + count, 0);
  return { activeMemoryCount, byType };
}

/** 用 LLM rollup 更新该用户×角色的 UserProfile。 */
export async function refreshUserProfile(
  userId: string,
  characterId: string,
): Promise<{ sourceVersion: number }> {
  const [existingProfile, referenceMemories, stats] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId_characterId: { userId, characterId } },
    }),
    // 参考记忆仅供长期画像 rollup，不含 event（一次性日程由 RAG 处理）
    prisma.userMemory.findMany({
      where: { userId, characterId, isDeleted: false, type: { not: 'event' } },
      orderBy: [{ confidence: 'desc' }, { lastActiveAt: 'desc' }],
      take: env.MEMORY_PROFILE_REFERENCE_LIMIT,
      select: { text: true, type: true, confidence: true },
    }),
    loadMemoryStats(userId, characterId),
  ]);

  const existingFacets = existingProfile?.facets
    ? profileFacetsSchema.safeParse(existingProfile.facets).data
    : undefined;

  const userPrompt = buildProfileRefreshPrompt({
    existingSummary: existingProfile?.summary,
    existingFacets,
    referenceMemories,
    stats,
  });

  logger.info({
    event: 'llm.profile.request',
    userId,
    characterId,
    model: env.OLLAMA_MODEL,
    referenceMemoryCount: referenceMemories.length,
    prompt: userPrompt,
  });

  const { output, text } = await generateText({
    model: getStructuredOllamaModel(env.OLLAMA_MODEL),
    output: Output.object({ schema: profileOutputSchema }),
    system: PROFILE_REFRESH_PROMPT,
    prompt: userPrompt,
    maxRetries: env.LLM_STRUCTURED_MAX_RETRIES,
  });

  logger.info({
    event: 'llm.profile.response',
    userId,
    characterId,
    model: env.OLLAMA_MODEL,
    response: text,
    output,
  });

  if (!output) {
    throw new Error('用户画像模型输出格式无效');
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId_characterId: { userId, characterId } },
    create: {
      userId,
      characterId,
      summary: output.summary.trim(),
      facets: output.facets,
      sourceVersion: 1,
    },
    update: {
      summary: output.summary.trim(),
      facets: output.facets,
      sourceVersion: { increment: 1 },
    },
  });

  return { sourceVersion: profile.sourceVersion };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 用户×角色画像刷新主流程，由 API / 管线以 fire-and-forget 或 await 调用。 */
export async function runProfileRefresh(
  job: ConsolidationJob,
  userId: string,
  characterId: string,
): Promise<void> {
  await updateConsolidationJob(job.id, {
    status: 'running',
    progress: '正在加载记忆与现有画像...',
    snapshot: { userId, characterId },
  });

  try {
    await updateConsolidationJob(job.id, { progress: '正在调用模型更新用户画像...' });

    const { sourceVersion } = await refreshUserProfile(userId, characterId);

    const result: ProfileJobResult = { sourceVersion };

    logger.info({
      event: 'llm.profile.complete',
      jobId: job.id,
      userId,
      characterId,
      sourceVersion,
    });

    await updateConsolidationJob(job.id, {
      status: 'completed',
      completedAt: Date.now(),
      progress: `画像更新完成（sourceVersion=${sourceVersion}）。`,
      result,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    logger.error({ err, jobId: job.id, userId, characterId }, '[ProfileRefresh] 用户画像更新失败');
    await updateConsolidationJob(job.id, {
      status: 'failed',
      completedAt: Date.now(),
      progress: '用户画像更新失败，可稍后重试。',
      error: errorMessage,
    });
  }
}
