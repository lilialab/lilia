import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { loadCharacter, loadPlatformSafety } from '@/prompts/load';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { buildRuntimeContextBlock, formatMemoryFragmentLine } from './prompt-format.utils';

export interface SystemPromptMeta {
  memoryFragments: string[];
  userProfile: string;
}

export interface SystemPromptResult {
  systemPrompt: string;
  meta: SystemPromptMeta;
}

/** 从会话解析 userId 与角色。 */
export async function resolveSessionContext(sessionId: string): Promise<{
  userId: string;
  characterId: string;
  characterSlug: string;
  characterDisplayName: string;
}> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      character: { select: { id: true, slug: true, displayName: true } },
    },
  });
  if (!session?.userId) {
    throw AppError.notFound('会话不存在');
  }
  return {
    userId: session.userId,
    characterId: session.character.id,
    characterSlug: session.character.slug,
    characterDisplayName: session.character.displayName,
  };
}

/** 获取该角色下的用户画像文本。 */
async function fetchUserProfile(userId: string, characterId: string): Promise<string> {
  return getUserProfileText(userId, characterId);
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
  const { userId, characterId, characterSlug } = await resolveSessionContext(sessionId);
  const now = new Date();
  const character = loadCharacter(characterSlug);
  const platformSafety = loadPlatformSafety();

  const [userProfile, memoryFragments] = await Promise.all([
    fetchUserProfile(userId, characterId),
    fetchMemoryFragmentsForPrompt(lastUserContent, userId, characterId),
  ]);

  const memoryFragmentLines = memoryFragments.map((fragment, index) =>
    formatMemoryFragmentLine(index + 1, fragment, timeZone)
  );

  const contextStr = memoryFragmentLines.length > 0
    ? memoryFragmentLines.join('\n')
    : '暂无相关历史记忆。';

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
