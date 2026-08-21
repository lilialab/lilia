import { getCookie, setCookie } from '@/lib/client/cookie';
import { isLocale, type Locale, LOCALE_COOKIE_MAX_AGE_SECONDS, LOCALE_COOKIE_NAME } from './config';

/**
 * 客户端：已存储的 UI 语言；无合法 Cookie 时为 undefined。
 * （非浏览器环境也为 undefined。）
 */
export function getLocale(): Locale | null {
  const raw = getCookie(LOCALE_COOKIE_NAME);
  if (raw && isLocale(raw)) {
    return raw;
  }
  return null;
}

/**
 * 客户端：写入 UI 语言偏好（Cookie）。
 * DB 双写由语言页（已登录）在 setLocale 之后 PATCH；登录后用 me.locale 再调 UI setLocale 校准。
 */
export function setLocale(locale: Locale): void {
  setCookie(LOCALE_COOKIE_NAME, locale, {
    maxAgeSeconds: LOCALE_COOKIE_MAX_AGE_SECONDS,
  });
}
