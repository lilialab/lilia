import type { z } from 'zod';

/** query 中空串视为 undefined（缺省与 ?key= 等价）。 */
export function emptyToUndefined(val: unknown): unknown {
  return val === '' || val === undefined ? undefined : val;
}

export function normalizeQueryRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, emptyToUndefined(value)]),
  );
}

/** query 字符串 'true'/'false' → boolean；undefined 原样返回（配合 .optional() 使用）。 */
export function queryStringToBoolean(val: 'true' | 'false' | undefined): boolean | undefined {
  if (val === undefined) return undefined;
  return val === 'true';
}

/** 供单测/非 URL 场景：与 Route 行为一致的 safeParse。 */
export function safeParseQueryParams<T extends z.ZodType>(
  schema: T,
  input: Record<string, unknown>,
) {
  return schema.safeParse(normalizeQueryRecord(input));
}
