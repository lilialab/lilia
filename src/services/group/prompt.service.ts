import { tCharacter } from '@/i18n/characters';
import type { Locale } from '@/i18n/config';
import { interpolate } from '@/prompts/interpolate';
import { loadCharacter, readPromptFile } from '@/prompts/load';
import {
  formatHistoricalContexts,
  formatRuntimeContextInner,
  xmlBlock,
} from '@/services/chat/format.utils';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { formatGroupChatRulesInner, formatGroupRosterInner } from './prompt.utils';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GroupSystemPromptMeta {
  memoryFragments: string;
  userProfile: string;
  groupChatRules: string;
  rosterBlock: string;
}

export interface GroupSystemPromptResult {
  systemPrompt: string;
  meta: GroupSystemPromptMeta;
}

export interface BuildGroupSystemPromptOptions {
  userId: string;
  userDisplayName: string;
  characterId: string;
  characterSlug: string;
  memberSlugs: readonly string[];
  lastUserContent: string;
  timeZone: string;
  locale: Locale;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 组装群聊 system prompt：被 @ 角色的人设 + 群花名册 + 当前角色私有画像/记忆 + 群聊约束。
 */
export async function buildGroupSystemPrompt({
  userId,
  userDisplayName,
  characterId,
  characterSlug,
  memberSlugs,
  lastUserContent,
  timeZone,
  locale,
}: BuildGroupSystemPromptOptions): Promise<GroupSystemPromptResult> {
  const now = new Date();
  const character = loadCharacter(characterSlug);
  const displayName = tCharacter(characterSlug, 'displayName', locale);
  const vars = { name: displayName, slug: characterSlug };
  const persona = interpolate(character.persona, vars);
  const characterProfile = interpolate(character.profile, vars);
  const groupChatRulesInner = formatGroupChatRulesInner(characterSlug);
  const rosterInner = formatGroupRosterInner({
    userDisplayName,
    currentSlug: characterSlug,
    memberSlugs,
  });

  const [userProfile, memoryFragments] = await Promise.all([
    getUserProfileText(userId, characterId),
    fetchMemoryFragmentsForPrompt(lastUserContent, userId, characterId),
  ]);

  const historicalContexts = formatHistoricalContexts(memoryFragments, timeZone);
  const runtimeContext = formatRuntimeContextInner(now, timeZone);
  const replyRules = readPromptFile('reply-rules.md');
  const groupChatRules = xmlBlock('group_chat_rules', groupChatRulesInner);
  const rosterBlock = xmlBlock('group_roster', rosterInner);

  const systemPrompt = [
    xmlBlock('system_mandate', persona),
    xmlBlock('character_profile', characterProfile),
    groupChatRules,
    rosterBlock,
    xmlBlock('user_profile', userProfile),
    xmlBlock('runtime_context', runtimeContext),
    xmlBlock('historical_contexts', historicalContexts),
    xmlBlock('reply_rules', replyRules),
  ].join('\n\n');

  return {
    systemPrompt,
    meta: {
      memoryFragments: historicalContexts,
      userProfile,
      groupChatRules,
      rosterBlock,
    },
  };
}
