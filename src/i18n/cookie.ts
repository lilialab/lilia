import { isLocale, type Locale, LOCALE_COOKIE_MAX_AGE_SECONDS, LOCALE_COOKIE_NAME } from './config';

function localeCookieValue(): string | undefined {
  const prefix = `${LOCALE_COOKIE_NAME}=`;
  const part = document.cookie.split('; ').find((entry) => entry.startsWith(prefix));
  return part?.slice(prefix.length);
}

/** 读取已写入的合法语言 Cookie；没有或非法时为 undefined。 */
export function readLocaleCookie(): Locale | undefined {
  const value = localeCookieValue();
  return value && isLocale(value) ? value : undefined;
}

/** 将语言偏好写入浏览器 Cookie。 */
export function writeLocaleCookie(locale: Locale): void {
  const secure = globalThis.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
