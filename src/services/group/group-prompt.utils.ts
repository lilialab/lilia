/**
 * 生成群花名册 XML 块：人类用户 + AI 成员（slug）；当前发言者标「你（本轮发言）」。
 */
export function formatGroupRosterBlock(options: {
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

  return ['<group_roster>', '本群成员：', userLine, ...memberLines, '</group_roster>'].join('\n');
}
