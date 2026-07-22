/**
 * 从文本中提取第一个 @slug（精确匹配用）。
 * 规则：/@([a-zA-Z0-9_-]+)/ 取第一处。
 */
export function extractFirstMentionSlug(text: string): string | null {
  const match = /@([a-zA-Z0-9_-]+)/.exec(text);
  return match?.[1] ?? null;
}

/** 群聊续聊触发语文案（turn_cue 正文）。 */
export function buildTurnCueText(characterSlug: string): string {
  return `【系统】你（@${characterSlug}）被点名，请基于上文以自己身份继续发言。`;
}
