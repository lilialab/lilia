/**
 * 群花名册正文（不含标签）：人类用户 + AI 成员（slug）；当前发言者标「你（本轮发言）」。
 */
export function formatGroupRoster(options: {
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
