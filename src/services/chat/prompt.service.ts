import { tCharacter } from '@/i18n/characters';
import { type Locale, parseLocale } from '@/i18n/config';
import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { interpolate } from '@/prompts/interpolate';
import { loadCharacter, readPromptFile } from '@/prompts/load';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { xmlBlock } from '@/utils/xml-block';
import { formatHistoricalContexts, formatRuntimeContextInner } from './format.utils';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SystemPromptMeta {
  memoryFragments: string;
  userProfile: string;
}

export interface SystemPromptResult {
  systemPrompt: string;
  meta: SystemPromptMeta;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 从会话解析 userId、角色与用户语言。 */
export async function resolveSessionContext(sessionId: string): Promise<{
  userId: string;
  characterId: string;
  characterSlug: string;
  locale: Locale;
}> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      user: { select: { locale: true } },
      character: { select: { id: true, slug: true } },
    },
  });
  if (!session?.userId) {
    throw AppError.notFound('会话不存在');
  }
  return {
    userId: session.userId,
    characterId: session.character.id,
    characterSlug: session.character.slug,
    locale: parseLocale(session.user?.locale),
  };
}

export interface BuildSystemPromptOptions {
  /** 设备 IANA 时区 */
  timeZone: string;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 核心导出函数：一键组装 System Prompt
 */
export async function buildSystemPrompt(
  sessionId: string,
  lastUserContent: string,
  options: BuildSystemPromptOptions,
): Promise<SystemPromptResult> {
  const { timeZone } = options;
  const { userId, characterId, characterSlug, locale } = await resolveSessionContext(sessionId);
  const now = new Date();

  const character = loadCharacter(characterSlug);
  const displayName = tCharacter(characterSlug, 'displayName', locale);
  const vars = { name: displayName, slug: characterSlug };
  const persona = interpolate(character.persona, vars);
  const characterProfile = interpolate(character.profile, vars);

  const [userProfile, memoryFragments] = await Promise.all([
    getUserProfileText(userId, characterId),
    fetchMemoryFragmentsForPrompt(lastUserContent, userId, characterId),
  ]);

  const historicalContexts = formatHistoricalContexts(memoryFragments, timeZone);
  const runtimeContext = formatRuntimeContextInner(now, timeZone);
  const replyRules = readPromptFile('reply-rules.md');

  const systemPrompt = [
    xmlBlock('system_mandate', persona),
    xmlBlock('character_profile', characterProfile),
    xmlBlock('user_profile', userProfile),
    xmlBlock('historical_contexts', historicalContexts),
    xmlBlock('runtime_context', runtimeContext),
    xmlBlock('reply_rules', replyRules),
  ].join('\n\n');

  return {
    systemPrompt,
    meta: {
      memoryFragments: historicalContexts,
      userProfile,
    },
  };
}
