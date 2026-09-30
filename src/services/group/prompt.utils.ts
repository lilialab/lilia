/** 花名册成员：slug 供 @ 交棒，name / shortBio 供模型判断该把话交给谁。 */
export interface GroupRosterMember {
  slug: string;
  name: string;
  shortBio: string;
}

/** 花名册里 shortBio 的展示上限；超出截断加省略号。 */
export const ROSTER_SHORT_BIO_MAX_LENGTH = 40;

/** 生成 ` — 简介`；空简介返回空串，避免行尾悬空破折号。 */
function formatShortBio(shortBio: string): string {
  const text = shortBio.trim();
  if (!text) return '';

  const clipped = text.length > ROSTER_SHORT_BIO_MAX_LENGTH
    ? `${text.slice(0, ROSTER_SHORT_BIO_MAX_LENGTH)}…`
    : text;

  return ` — ${clipped}`;
}

/**
 * 群花名册正文（不含标签）：人类用户（带 handle，可交回并结束本轮）+ AI 成员（slug / 展示名 / 简介）。
 * 标出当前发言者与本轮已发过言的成员，供模型换人而不是原地打转。
 */
export function formatGroupRoster(options: {
  userNickname: string;
  currentSlug: string;
  members: readonly GroupRosterMember[];
  /** 本轮（用户最近一条消息之后）已发过言的成员 slug */
  spokenSlugs: readonly string[];
}): string {
  const { userNickname, currentSlug, members, spokenSlugs } = options;
  const spoken = new Set(spokenSlugs);
  const userLine = `- @${userNickname} (the human, not an AI)`;
  const memberLines = members.map(({ slug, name, shortBio }) => {
    const status = slug === currentSlug
      ? ' (you, speaking this turn)'
      : spoken.has(slug)
      ? ' (spoke already this round)'
      : '';
    return `- @${slug} ${name}${status}${formatShortBio(shortBio)}`;
  });

  return ['Group members:', userLine, ...memberLines].join('\n');
}
