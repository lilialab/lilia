export const locales = ['en', 'zh', 'ja'] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** 语言选择器用的自称（不随界面语言翻译）。 */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

const localeHtmlLang: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
};

/** 语言偏好 Cookie 逻辑名（实际名由 `lib/client/cookie` 加 `pai_` 前缀）。 */
export const LOCALE_COOKIE_NAME = 'locale';

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

/** 浏览器语言标签：主语言在 locales 内则用之，否则默认语言。 */
export function localeFromBrowserLanguage(tag: string | undefined | null): Locale {
  const primary = tag?.split('-')[0]?.toLowerCase();
  if (primary && isLocale(primary)) {
    return primary;
  }
  return DEFAULT_LOCALE;
}

export function localeToHtmlLang(locale: Locale): string {
  return localeHtmlLang[locale];
}
