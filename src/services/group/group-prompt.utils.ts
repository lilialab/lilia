export type GroupRosterMember = {
  slug: string;
  displayName: string;
  shortBio: string | undefined;
};

/**
 * 生成群花名册 XML 块：人类用户 + AI 成员；当前发言者标「你（本轮发言）」。
 */
export function formatGroupRosterBlock(options: {
  userDisplayName: string;
  currentSlug: string;
  members: readonly GroupRosterMember[];
}): string {
  const { userDisplayName, currentSlug, members } = options;
  const userLine = `- 人类用户：${userDisplayName}（非 AI，无 slug，不可用 @slug 召唤）`;
  const memberLines = members.map((member) => {
    const you = member.slug === currentSlug ? '你（本轮发言）；' : '';
    const bio = member.shortBio ? `；简介：${member.shortBio}` : '';
    return `- ${you}${member.displayName}（slug：${member.slug}）${bio}`;
  });

  return ['<group_roster>', '本群成员：', userLine, ...memberLines, '</group_roster>'].join('\n');
}
