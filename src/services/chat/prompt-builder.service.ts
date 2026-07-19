import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { VectorService } from '@/services/memory/vector.service';
import { loadCharacter, loadPlatformSafety } from '@/prompts/load';
import {
  buildRuntimeContextBlock,
  formatMemoryFragmentLine,
  type MemoryFragment,
} from './prompt-format.utils';
import { AppError } from '@/lib/server/app-error';

export interface SystemPromptMeta {
  memoryFragments: string[];
  userProfile: string;
}

export interface SystemPromptResult {
  systemPrompt: string;
  meta: SystemPromptMeta;
}

const vectorService = new VectorService();

/** 从会话解析 userId 与角色 slug。 */
export async function resolveSessionContext(
  sessionId: string,
): Promise<{ userId: string; characterSlug: string }> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      character: { select: { slug: true } },
    },
  });
  if (!session?.userId) {
    throw AppError.notFound('会话不存在');
  }
  return { userId: session.userId, characterSlug: session.character.slug };
}

/** 获取用户画像文本。 */
async function fetchUserProfile(userId: string): Promise<string> {
  return getUserProfileText(userId);
}

/** 按用户输入从向量记忆库检索相关历史片段（含衰减重排与命中回写）。 */
async function fetchHistoricalContext(content: string, userId: string): Promise<MemoryFragment[]> {
  if (!content) return [];
  try {
    const hits = await vectorService.queryMemoryWithDecay(content, undefined, { userId });
    const ids = hits.map((hit) => hit.id);
    if (ids.length === 0) return [];

    void vectorService.touchMemories(ids).catch((err) => {
      logger.warn({ err }, '[Chroma] 记忆 lastActiveAt 回写失败');
    });

    const rows = await prisma.userMemory.findMany({
      where: { id: { in: ids } },
      select: { id: true, type: true, createdAt: true, lastActiveAt: true },
    });
    const rowById = new Map(rows.map((row) => [row.id, row]));

    const fragments: MemoryFragment[] = [];
    for (const hit of hits) {
      const row = rowById.get(hit.id);
      if (!row) {
        logger.warn({ memoryId: hit.id }, '[RAG] Chroma 命中但 MySQL 无对应记忆，已跳过');
        continue;
      }
      fragments.push({
        text: hit.text,
        type: row.type as MemoryFragment['type'],
        recordedAt: row.createdAt,
        lastActiveAt: row.lastActiveAt,
      });
    }
    return fragments;
  } catch (err) {
    logger.error({ err }, '[Chroma] 知识库检索失败');
    return [];
  }
}

export interface BuildSystemPromptOptions {
  /** 用户库内 IANA 时区 */
  timeZone: string;
}

/**
 * 核心导出函数：一键组装 System Prompt
 */
export async function buildSystemPrompt(
  sessionId: string,
  lastUserContent: string,
  options: BuildSystemPromptOptions,
): Promise<SystemPromptResult> {
  const { timeZone } = options;
  const { userId, characterSlug } = await resolveSessionContext(sessionId);
  const now = new Date();
  const character = loadCharacter(characterSlug);
  const platformSafety = loadPlatformSafety();

  const [userProfile, memoryFragments] = await Promise.all([
    fetchUserProfile(userId),
    fetchHistoricalContext(lastUserContent, userId),
  ]);

  const memoryFragmentLines = memoryFragments.map((fragment, index) =>
    formatMemoryFragmentLine(index + 1, fragment, timeZone),
  );

  const contextStr =
    memoryFragmentLines.length > 0 ? memoryFragmentLines.join('\n') : '暂无相关历史记忆。';

  const runtimeContext = buildRuntimeContextBlock(now, timeZone);

  const systemPrompt = `
    # 【第一层：核心宪法】(开发者定义，最高权重)
    <platform_safety>
    ${platformSafety}
    </platform_safety>

    <system_mandate>
    ${character.persona}
    </system_mandate>

    # 【第二层：动态画像与记忆】(由 AI 持续观察并维护)
    <user_profile>
    ${userProfile}
    </user_profile>

    # 【运行时上下文】
    ${runtimeContext}

    <historical_contexts>
    以下是与当前话题相关的历史记忆片段：
    ${contextStr}
    </historical_contexts>

    # 【执行约束】
    请结合“第一层”的灵魂人设与“第二层”的用户记忆回应用户。向用户提及时间时一律使用用户本地时区与自然口语；不要向用户播报 UTC 或 ISO。记忆「记录于/最近活跃于」或 event 的「系统收录于/最近召回于」是系统元数据；event 类日程以正文中的日期时刻为准。
  `.trim();

  return {
    systemPrompt,
    meta: {
      memoryFragments: memoryFragmentLines,
      userProfile,
    },
  };
}
