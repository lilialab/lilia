/** 客户端非 HttpOnly Cookie 统一前缀。 */
export const CLIENT_COOKIE_PREFIX = 'pai_';

export interface SetCookieOptions {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

function resolveCookieName(name: string): string {
  return name.startsWith(CLIENT_COOKIE_PREFIX) ? name : `${CLIENT_COOKIE_PREFIX}${name}`;
}

/** 读取 document Cookie；`name` 为逻辑名（自动加 `pai_` 前缀）。 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const key = resolveCookieName(name);
  const prefix = `${key}=`;
  const part = document.cookie.split('; ').find((entry) => entry.startsWith(prefix));
  return part?.slice(prefix.length);
}

/** 写入 document Cookie（非 HttpOnly；Secure 随当前页协议）。 */
export function setCookie(name: string, value: string, options: SetCookieOptions = {}): void {
  if (typeof document === 'undefined') {
    return;
  }
  const key = resolveCookieName(name);
  const path = options.path ?? '/';
  const sameSite = options.sameSite ?? 'Lax';
  const maxAge = options.maxAgeSeconds !== undefined
    ? `; Max-Age=${options.maxAgeSeconds}`
    : '';
  const secure = globalThis.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${key}=${value}; Path=${path}; SameSite=${sameSite}${maxAge}${secure}`;
}

/** 删除 document Cookie。 */
export function deleteCookie(name: string, path = '/'): void {
  setCookie(name, '', { path, maxAgeSeconds: 0 });
}
