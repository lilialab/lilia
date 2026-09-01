/**
 * 群花名册正文（不含标签）：人类用户 + AI 成员（slug）；当前发言者标「你（本轮发言）」。
 */
export function formatGroupRoster(options: {
  userNickname: string;
  currentSlug: string;
  memberSlugs: readonly string[];
}): string {
  const { userNickname, currentSlug, memberSlugs } = options;
  const userLine = `- Human: ${userNickname} (not an AI; do not @ them)`;
  const memberLines = memberSlugs.map((slug) => {
    const you = slug === currentSlug ? ' (you, speaking this turn)' : '';
    return `- ${slug}${you}`;
  });

  return ['Group members:', userLine, ...memberLines].join('\n');
}
