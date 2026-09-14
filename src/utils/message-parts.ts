export type TextMessagePart = { type: 'text'; text: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTextPart(part: unknown): part is { type: 'text'; text: string } {
  return (
    isRecord(part)
    && part.type === 'text'
    && typeof part.text === 'string'
  );
}

/** 抽出 trim 后非空的 text parts（忽略 reasoning 等）。 */
export function collectTextParts(parts: unknown): TextMessagePart[] {
  if (!Array.isArray(parts)) return [];
  return parts
    .filter(isTextPart)
    .map((part): TextMessagePart => ({ type: 'text', text: part.text.trim() }))
    .filter((part) => part.text.length > 0);
}

/** 将 text parts 拼成多行正文。 */
export function extractTextFromParts(parts: unknown): string {
  return collectTextParts(parts)
    .map((part) => part.text)
    .join('\n');
}
