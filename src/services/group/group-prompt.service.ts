import { loadCharacter, loadPlatformSafety } from '@/prompts/load';
import {
  buildRuntimeContextBlock,
  formatMemoryFragmentLine,
} from '@/services/chat/prompt-format.utils';
import { fetchMemoryFragmentsForPrompt } from '@/services/memory/rag-context.service';
import { getUserProfileText } from '@/services/memory/user-profile.service';

export interface GroupSystemPromptMeta {
  memoryFragments: string[];
  userProfile: string;
}

export interface GroupSystemPromptResult {
  systemPrompt: string;
  meta: GroupSystemPromptMeta;
}

/**
 * 组装群聊 system prompt：被 @ 角色的人设 + 共享画像/记忆 + 群聊约束。
 */
export async function buildGroupSystemPrompt(options: {
  userId: string;
  characterSlug: string;
  lastUserContent: string;
  timeZone: string;
}): Promise<GroupSystemPromptResult> {
  const { userId, characterSlug, lastUserContent, timeZone } = options;
  const now = new Date();
  const character = loadCharacter(characterSlug);
  const platformSafety = loadPlatformSafety();

  const [userProfile, memoryFragments] = await Promise.all([
    getUserProfileText(userId),
    fetchMemoryFragmentsForPrompt(lastUserContent, userId),
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

    # 【群聊约束】
    <group_chat_rules>
    你在群聊中，只代表自己（显示名：${character.displayName}，slug：${character.id}）。
    用户或其他成员通过 @${character.id} 点名你时你才应被召唤回复；不要假扮其他成员发言。
    历史消息中助手发言可能带有 (slug): 前缀，仅供你区分说话人，属于系统标注。
    你的回复必须是纯正文：不要输出 (slug): 或 (${character.id}): 这类前缀；不要续写其他成员的台词。
    若需召唤其他成员，只在正文中写 @对方slug，由系统再召唤对方，不要代替对方回答。
    </group_chat_rules>

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
