/**
 * 群花名册正文（不含标签）：人类用户 + AI 成员（slug）；当前发言者标「你（本轮发言）」。
 */
export function formatGroupRosterInner(options: {
  userDisplayName: string;
  currentSlug: string;
  memberSlugs: readonly string[];
}): string {
  const { userDisplayName, currentSlug, memberSlugs } = options;
  const userLine = `- 人类用户：${userDisplayName}（非 AI，无 slug，不可用 @slug 召唤）`;
  const memberLines = memberSlugs.map((slug) => {
    const you = slug === currentSlug ? '你（本轮发言）；' : '';
    return `- ${you}${slug}`;
  });

  return ['本群成员：', userLine, ...memberLines].join('\n');
}

/** 群聊发言约束正文（不含标签）。 */
export function formatGroupChatRulesInner(characterSlug: string): string {
  return [
    `你在群聊中，只代表自己（slug：${characterSlug}）。`,
    `用户或其他成员通过 @${characterSlug} 点名你时你才应被召唤回复；不要假扮其他成员发言。`,
    '历史消息中助手发言可能带有 (slug): 前缀，仅供你区分说话人，属于系统标注。',
    `你的回复必须是纯正文：不要输出 (slug): 或 (${characterSlug}): 这类前缀；不要续写其他成员的台词。`,
    '若需召唤其他成员，只在正文中写 @对方slug，由系统再召唤对方，不要代替对方回答。',
  ].join('\n');
}
