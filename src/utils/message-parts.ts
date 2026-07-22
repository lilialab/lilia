export type TextMessagePart = { type: 'text'; text: string };

function isTextPart(part: unknown): part is { type: 'text'; text: string } {
  return (
    typeof part === 'object'
    && part !== null
    && (part as { type?: unknown }).type === 'text'
    && typeof (part as { text?: unknown }).text === 'string'
  );
}

/** 抽出 trim 后非空的 text parts（忽略 reasoning 等）。 */
export function collectTextParts(parts: unknown): TextMessagePart[] {
  if (!Array.isArray(parts)) return [];
  return parts
    .filter(isTextPart)
    .map((part) => ({ type: 'text' as const, text: part.text.trim() }))
    .filter((part) => part.text.length > 0);
}

/** 将 text parts 拼成多行正文。 */
export function extractTextFromParts(parts: unknown): string {
  return collectTextParts(parts)
    .map((part) => part.text)
    .join('\n');
}
