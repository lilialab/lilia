import { parseApiResponse } from '@/lib/client/api-client';

export type ApiFetchJsonInit = RequestInit & {
  json?: unknown;
};

/** 带 Cookie 会话的 fetch 封装。 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  });
}

let handlingUnauthorized = false;

/** 清会话 Cookie 后硬跳 /login；并发 401 只处理一次。 */
async function handleUnauthorizedRedirect(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;

  try {
    // 直调 fetch，避免再走 apiFetchJson 递归
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // 忽略：即使 revoke 失败也要离开受保护页
  }

  window.location.assign('/login');
}

function toRequestInit(init?: ApiFetchJsonInit): RequestInit | undefined {
  if (!init) return undefined;
  const { json, ...rest } = init;
  if (json === undefined) return rest;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  return { ...rest, headers, body: JSON.stringify(json) };
}

/** 带 Cookie 的 fetch，并解析标准 API JSON 响应的 data 字段。`json` 会序列化为 JSON body。 */
export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init?: ApiFetchJsonInit,
): Promise<T> {
  const res = await apiFetch(input, toRequestInit(init));

  // 401 只表示正式会话失效；业务失败（密码错、缺试聊凭证等）用其它状态码。
  if (res.status === 401) {
    void handleUnauthorizedRedirect();
    throw new Error('未登录');
  }

  return parseApiResponse<T>(res);
}
