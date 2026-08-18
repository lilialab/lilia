import { type Locale, LOCALE_COOKIE_MAX_AGE_SECONDS, LOCALE_COOKIE_NAME } from './config';

/** 将语言偏好写入浏览器 Cookie。 */
export function writeLocaleCookie(locale: Locale): void {
  const secure = globalThis.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
