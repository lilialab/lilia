import { parseApiResponse } from '@/lib/client/api-client';

/** 带 Cookie 会话的 fetch 封装。 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** 登录/注册的 401 表示凭证错误，不触发踢登录。 */
function shouldIgnoreUnauthorizedRedirect(input: RequestInfo | URL): boolean {
  const url = requestUrl(input);
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
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

/** 带 Cookie 的 fetch，并解析标准 API JSON 响应的 data 字段。 */
export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(input, init);

  if (res.status === 401 && !shouldIgnoreUnauthorizedRedirect(input)) {
    void handleUnauthorizedRedirect();
    throw new Error('未登录');
  }

  return parseApiResponse<T>(res);
}
