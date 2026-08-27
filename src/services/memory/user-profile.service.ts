import { env } from '@/lib/server/env';
import { getChatModel } from '@/lib/server/llm';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { loadJobPrompt } from '@/prompts/load';
import type { ConsolidationJob, ProfileJobResult } from '@/types/consolidation-job';
import { generateText } from 'ai';
import { updateConsolidationJob } from './job.service';

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

const EMPTY_PROFILE_TEXT = '目前暂无特殊偏好记录。';

const PROFILE_REFRESH_PROMPT = loadJobPrompt('profile');

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 将参考记忆列表格式化为 prompt 中的 bullet 文本。 */
function formatMemoryList(memories: { text: string; type: string; confidence: number }[]): string {
  if (memories.length === 0) return '（无）';
  return memories
    .map((memory) =>
      `- [${memory.type}, confidence=${memory.confidence.toFixed(2)}] ${memory.text}`
    )
    .join('\n');
}

/** 组装画像刷新 prompt 正文（纯函数，便于单测）。 */
export function buildProfileRefreshPrompt(input: {
  existingText: string | null | undefined;
  referenceMemories: { text: string; type: string; confidence: number }[];
}): string {
  return [
    '【现有画像】',
    input.existingText?.trim() || '（无）',
    '',
    '【参考记忆（高置信度与活跃度优先）】',
    formatMemoryList(input.referenceMemories),
  ].join('\n');
}

/* -------------------------------------------------------------------------- */
/* Profile refresh                                                            */
/* -------------------------------------------------------------------------- */

/** 读取该用户×角色画像；空则占位句。 */
export async function getUserProfileText(userId: string, characterId: string): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { text: true },
  });

  return profile?.text?.trim() || EMPTY_PROFILE_TEXT;
}

/** 用 LLM rollup 更新该用户×角色的 UserProfile。 */
export async function refreshUserProfile(
  userId: string,
  characterId: string,
): Promise<{ sourceVersion: number }> {
  const [existingProfile, referenceMemories] = await Promise.all([
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
  ]);

  const userPrompt = buildProfileRefreshPrompt({
    existingText: existingProfile?.text,
    referenceMemories,
  });

  logger.info({
    event: 'llm.profile.request',
    userId,
    characterId,
    model: env.LLM_MODEL,
    referenceMemoryCount: referenceMemories.length,
    prompt: userPrompt,
  });

  const { text } = await generateText({
    model: getChatModel(),
    instructions: PROFILE_REFRESH_PROMPT,
    prompt: userPrompt,
    maxRetries: env.LLM_STRUCTURED_MAX_RETRIES,
  });

  logger.info({
    event: 'llm.profile.response',
    userId,
    characterId,
    model: env.LLM_MODEL,
    response: text,
  });

  const profileText = text.trim() || null;

  const profile = await prisma.userProfile.upsert({
    where: { userId_characterId: { userId, characterId } },
    create: {
      userId,
      characterId,
      text: profileText,
      sourceVersion: 1,
    },
    update: {
      text: profileText,
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
