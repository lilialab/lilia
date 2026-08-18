export const locales = ['en', 'zh'] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** 浏览器语言偏好 Cookie（非 HttpOnly，客户端可写）。 */
export const LOCALE_COOKIE_NAME = 'pai_arbor_locale';

export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** 解析 Cookie / 任意字符串；无效时回落默认语言。 */
export function parseLocale(value: string | undefined | null): Locale {
  if (value && isLocale(value)) {
    return value;
  }
  return DEFAULT_LOCALE;
}

export function localeToHtmlLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en';
}
