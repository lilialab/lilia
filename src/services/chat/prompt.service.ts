import { type Locale, parseLocale } from '@/i18n/config';
import { AppError } from '@/lib/server/app-error';
import { prisma } from '@/lib/server/prisma';
import { interpolate } from '@/prompts/interpolate';
import { readPromptFile } from '@/prompts/load';
import { parseCharacterProfile, parseCharacterSkills } from '@/services/character/definition.utils';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { type JsonObject, jsonToYaml } from '@/utils/json-yaml';
import { xmlBlock } from '@/utils/xml-block';
import { formatMemories, formatRuntimeContext } from './format.utils';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SystemPromptMeta {
  memories: string;
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
  userNickname: string;
  characterId: string;
  characterSlug: string;
  characterName: string;
  persona: JsonObject;
  skills: string[];
  locale: Locale;
}> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      user: { select: { locale: true, nickname: true } },
      character: { select: { id: true, slug: true, name: true, profile: true, skills: true } },
    },
  });
  if (!session) {
    throw AppError.notFound('会话不存在');
  }
  return {
    userId: session.userId,
    userNickname: session.user.nickname,
    characterId: session.character.id,
    characterSlug: session.character.slug,
    characterName: session.character.name,
    persona: parseCharacterProfile(session.character.profile),
    skills: parseCharacterSkills(session.character.skills),
    locale: parseLocale(session.user.locale),
  };
}

export interface BuildSystemPromptOptions {
  /** 设备 IANA 时区 */
  timeZone: string;
  /** 本轮用户消息写入前，会话里上一条消息的时间 */
  previousMessageAt?: Date | null;
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
  const { timeZone, previousMessageAt } = options;
  const { userId, userNickname, characterId, characterSlug, characterName, persona } =
    await resolveSessionContext(
      sessionId,
    );
  const now = new Date();

  const vars = { name: characterName, slug: characterSlug };
  const characterProfile = interpolate(jsonToYaml(persona), vars);

  const [userProfile, memoryFragments] = await Promise.all([
    getUserProfileText(userId, characterId, userNickname),
    fetchMemoryFragmentsForPrompt(lastUserContent, userId, characterId),
  ]);

  const memories = formatMemories(memoryFragments, timeZone);
  const runtimeContext = formatRuntimeContext(now, timeZone, previousMessageAt);
  const replyRules = readPromptFile('reply-rules.md');

  const systemPrompt = [
    xmlBlock('character_profile', characterProfile),
    xmlBlock('reply_rules', replyRules),
    xmlBlock('user_profile', userProfile),
    xmlBlock('memories', memories),
    xmlBlock('runtime_context', runtimeContext),
  ].join('\n\n');

  return {
    systemPrompt,
    meta: {
      memories,
      userProfile,
    },
  };
}
