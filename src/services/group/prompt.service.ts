import type { Locale } from '@/i18n/config';
import { interpolate } from '@/prompts/interpolate';
import { readPromptFile } from '@/prompts/load';
import { formatMemories, formatRuntimeContext } from '@/services/chat/format.utils';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';
import { type JsonObject, jsonToYaml } from '@/utils/json-yaml';
import { xmlBlock } from '@/utils/xml-block';
import { formatGroupRoster, type GroupRosterMember } from './prompt.utils';

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
  members: readonly GroupRosterMember[];
  /** 用户语言：决定 few-shot 示例用哪份文案 */
  locale: Locale;
  /** 本轮（用户最近一条消息之后）已发过言的成员 slug */
  spokenSlugs: readonly string[];
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
  members,
  locale,
  spokenSlugs,
  lastUserContent,
  timeZone,
  previousMessageAt,
}: BuildGroupSystemPromptOptions): Promise<GroupSystemPromptResult> {
  const now = new Date();
  // 示例用真实 handle：{{human}} 用户昵称；{{other}} / {{otherName}} 另一位成员的 slug 与展示名
  const other = members.find((m) => m.slug !== characterSlug);
  const vars = {
    name: characterName,
    slug: characterSlug,
    human: userNickname,
    other: other?.slug ?? userNickname,
    otherName: other?.name ?? userNickname,
  };
  const characterProfile = interpolate(jsonToYaml(persona), vars);
  const groupChatRules = interpolate(readPromptFile('group-chat-rules.md'), vars);
  // 群里只有自己时交棒无从谈起，跳过示例（否则示例会示范「和自己对话」）
  const groupChatExamples = other
    ? interpolate(readPromptFile(`group-chat-examples.${locale}.md`), vars)
    : '';
  const roster = formatGroupRoster({
    userNickname,
    currentSlug: characterSlug,
    members,
    spokenSlugs,
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
    ...(groupChatExamples ? [xmlBlock('group_chat_examples', groupChatExamples)] : []),
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
