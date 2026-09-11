import { interpolate } from '@/prompts/interpolate';
import { readPromptFile } from '@/prompts/load';
import { formatMemories, formatRuntimeContext } from '@/services/chat/format.utils';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { type JsonObject, jsonToYaml } from '@/utils/json-yaml';
import { xmlBlock } from '@/utils/xml-block';
import { formatGroupRoster } from './prompt.utils';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GroupSystemPromptMeta {
  memories: string;
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
  userNickname: string;
  characterId: string;
  characterSlug: string;
  characterName: string;
  persona: JsonObject;
  memberSlugs: readonly string[];
  lastUserContent: string;
  timeZone: string;
  /** 本轮用户/turn_cue 写入前，群里上一条消息的时间 */
  previousMessageAt?: Date | null;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 组装群聊 system prompt：被 @ 角色的人设 + 群花名册 + 当前角色私有画像/记忆 + 群聊约束。
 */
export async function buildGroupSystemPrompt({
  userId,
  userNickname,
  characterId,
  characterSlug,
  characterName,
  persona,
  memberSlugs,
  lastUserContent,
  timeZone,
  previousMessageAt,
}: BuildGroupSystemPromptOptions): Promise<GroupSystemPromptResult> {
  const now = new Date();
  const vars = { name: characterName, slug: characterSlug };
  const characterProfile = interpolate(jsonToYaml(persona), vars);
  const groupChatRules = interpolate(readPromptFile('group-chat-rules.md'), vars);
  const roster = formatGroupRoster({
    userNickname,
    currentSlug: characterSlug,
    memberSlugs,
  });

  const [userProfile, memoryFragments] = await Promise.all([
    getUserProfileText(userId, characterId, userNickname),
    fetchMemoryFragmentsForPrompt(lastUserContent, userId, characterId),
  ]);

  const memories = formatMemories(memoryFragments, timeZone);
  const runtimeContext = formatRuntimeContext(now, timeZone, previousMessageAt);
  const replyRules = readPromptFile('reply-rules.md');

  const systemPrompt = [
    xmlBlock('character_profile', characterProfile),
    xmlBlock('group_chat_rules', groupChatRules),
    xmlBlock('group_roster', roster),
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
      groupChatRules,
      rosterBlock: roster,
    },
  };
}
