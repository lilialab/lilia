import { type NextRequest } from 'next/server';
import type { z } from 'zod';
import { badRequest } from '@/lib/server/api-handler';
import { normalizeQueryRecord } from '@/schemas/query';

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return '请求参数无效';
  }

  const path = issue.path.map(String).join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

/** 用 Zod schema 解析任意输入；失败时抛 400。 */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    badRequest(formatZodError(result.error));
  }
  return result.data;
}

/** 用 Zod schema 解析 URLSearchParams；失败时抛 400。 */
export function parseSearchParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
): z.infer<T> {
  const raw = Object.fromEntries(searchParams.entries());
  return parseInput(schema, normalizeQueryRecord(raw));
}

/** 用 Zod schema 解析 JSON body；失败时抛 400。 */
export async function parseJsonBody<T extends z.ZodType>(
  schema: T,
  req: NextRequest,
): Promise<z.infer<T>> {
  const body: unknown = await req.json();
  return parseInput(schema, body);
}

/** 用 Zod schema 解析动态路由 params；失败时抛 400。 */
export async function parseRouteParams<T extends z.ZodType>(
  schema: T,
  paramsPromise: Promise<unknown>,
): Promise<z.infer<T>> {
  const params = await paramsPromise;
  return parseInput(schema, params);
}
