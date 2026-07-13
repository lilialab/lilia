import { parseApiResponse } from '@/lib/client/api-client';

/** 带 Cookie 会话的 fetch 封装。 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  });
}

interface ApiFetchJsonInit extends RequestInit {
  /** HTTP 401 时返回 null，不解析 body、不抛错（如 /api/auth/me） */
  nullOnUnauthorized?: boolean;
}

/** 带 Cookie 的 fetch，并解析标准 API JSON 响应的 data 字段。 */
export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init?: ApiFetchJsonInit,
): Promise<T> {
  const { nullOnUnauthorized, ...fetchInit } = init ?? {};
  const res = await apiFetch(input, fetchInit);

  if (nullOnUnauthorized && res.status === 401) {
    return null as T;
  }

  return parseApiResponse<T>(res);
}
