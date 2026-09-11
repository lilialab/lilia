import { env } from '@/lib/server/env';
import { getChatModel } from '@/lib/server/llm';
import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { readJobPrompt } from '@/prompts/load';
import type { MemoryJob, ProfileJobResult } from '@/types/memory-job';
import { xmlBlock } from '@/utils/xml-block';
import { generateText, Output } from 'ai';
import { isDeepStrictEqual } from 'node:util';
import { updateMemoryJob } from './job.service';
import {
  formatUserProfileForPrompt,
  parseUserProfileData,
  profileLlmOutputSchema,
  type ProfileSnapshot,
  snapshotFromLlmOutput,
} from './user-profile.utils';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 将参考记忆列表格式化为 prompt 中的 bullet 文本。 */
function formatMemoryList(memories: { text: string; type: string; confidence: number }[]): string {
  if (memories.length === 0) return 'None.';
  return memories
    .map((memory) =>
      `- [${memory.type}, confidence=${memory.confidence.toFixed(2)}] ${memory.text}`
    )
    .join('\n');
}

/** 组装画像 system prompt。 */
export function buildProfileSystemPrompt(): string {
  return xmlBlock('user_profile_rules', readJobPrompt('user-profile'));
}

/** 组装画像刷新 prompt 正文（纯函数，便于单测）。 */
export function buildProfileRefreshPrompt(input: {
  existing: ProfileSnapshot;
  referenceMemories: { text: string; type: string; confidence: number }[];
}): string {
  return [
    'Current profile',
    JSON.stringify(input.existing, null, 2),
    '',
    'Reference memories',
    formatMemoryList(input.referenceMemories),
  ].join('\n');
}

export interface ProfileModelResult {
  systemPrompt: string;
  userPrompt: string;
  output: ProfileSnapshot | undefined;
  text: string;
  error: string | undefined;
}

/** 按全局规则调用画像模型；失败时 error 有值，不抛。 */
export async function generateProfileModelOutput(
  characterSlug: string,
  existing: ProfileSnapshot,
  referenceMemories: { text: string; type: string; confidence: number }[],
): Promise<ProfileModelResult> {
  const systemPrompt = buildProfileSystemPrompt();
  const userPrompt = buildProfileRefreshPrompt({ existing, referenceMemories });

  try {
    const { output, text } = await generateText({
      model: getChatModel(),
      output: Output.object({ schema: profileLlmOutputSchema }),
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
        error: '画像模型输出格式无效',
      };
    }

    return {
      systemPrompt,
      userPrompt,
      output: snapshotFromLlmOutput(output),
      text,
      error: undefined,
    };
  } catch (err) {
    logger.warn({ event: 'llm.profile.failed', err, characterSlug }, '画像结构化输出生成失败');
    return {
      systemPrompt,
      userPrompt,
      output: undefined,
      text: '',
      error: '画像模型输出格式无效',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Profile refresh                                                            */
/* -------------------------------------------------------------------------- */

/** 读取该用户×角色画像并格式化为 prompt 正文。 */
export async function getUserProfileText(
  userId: string,
  characterId: string,
  nickname: string,
): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { data: true },
  });

  return formatUserProfileForPrompt(profile?.data, nickname);
}

/** 用 LLM 全量快照更新该用户×角色的 UserProfile。 */
export async function refreshUserProfile(
  userId: string,
  characterId: string,
): Promise<{ sourceVersion: number }> {
  const [existingProfile, referenceMemories, character] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId_characterId: { userId, characterId } },
    }),
    // 含 event：一次性日程由提示词排除；进行中的状态可压进 now
    prisma.userMemory.findMany({
      where: { userId, characterId, isDeleted: false },
      orderBy: [{ confidence: 'desc' }, { lastActiveAt: 'desc' }],
      take: env.MEMORY_PROFILE_REFERENCE_LIMIT,
      select: { text: true, type: true, confidence: true },
    }),
    prisma.character.findUnique({
      where: { id: characterId },
      select: { slug: true },
    }),
  ]);

  if (!character) {
    throw new Error(`角色不存在: ${characterId}`);
  }

  const existingData = parseUserProfileData(existingProfile?.data);

  logger.info({
    event: 'llm.profile.request',
    userId,
    characterId,
    model: env.LLM_MODEL,
    referenceMemoryCount: referenceMemories.length,
    prompt: buildProfileRefreshPrompt({
      existing: existingData,
      referenceMemories,
    }),
  });

  const { output, text, error } = await generateProfileModelOutput(
    character.slug,
    existingData,
    referenceMemories,
  );

  logger.info({
    event: 'llm.profile.response',
    userId,
    characterId,
    model: env.LLM_MODEL,
    response: text,
    output,
  });

  if (error || !output) {
    throw new Error(error ?? '模型输出格式无效，无法解析');
  }

  const unchanged = isDeepStrictEqual(existingData, output);

  if (unchanged) {
    return { sourceVersion: existingProfile?.sourceVersion ?? 0 };
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId_characterId: { userId, characterId } },
    create: {
      userId,
      characterId,
      data: output,
      sourceVersion: 1,
    },
    update: {
      data: output,
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
  job: MemoryJob,
  userId: string,
  characterId: string,
): Promise<void> {
  await updateMemoryJob(job.id, {
    status: 'running',
    progress: '正在加载记忆与现有画像...',
    snapshot: { userId, characterId },
  });

  try {
    await updateMemoryJob(job.id, { progress: '正在调用模型更新用户画像...' });

    const { sourceVersion } = await refreshUserProfile(userId, characterId);

    const result: ProfileJobResult = { sourceVersion };

    logger.info({
      event: 'llm.profile.complete',
      jobId: job.id,
      userId,
      characterId,
      sourceVersion,
    });

    await updateMemoryJob(job.id, {
      status: 'completed',
      completedAt: Date.now(),
      progress: `画像更新完成（sourceVersion=${sourceVersion}）。`,
      result,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    logger.error({ err, jobId: job.id, userId, characterId }, '[ProfileRefresh] 用户画像更新失败');
    await updateMemoryJob(job.id, {
      status: 'failed',
      completedAt: Date.now(),
      progress: '用户画像更新失败，可稍后重试。',
      error: errorMessage,
    });
  }
}
