export const LANGUAGE_RETURN_PATHS = ['/login', '/register', '/me/settings'] as const;

export type LanguageReturnPath = (typeof LANGUAGE_RETURN_PATHS)[number];

export function isLanguageReturnPath(value: string): value is LanguageReturnPath {
  return (LANGUAGE_RETURN_PATHS as readonly string[]).includes(value);
}

/** 解析语言页回跳地址；非法或缺省时回落登录页。 */
export function parseLanguageReturnTo(
  value: string | string[] | undefined | null,
): LanguageReturnPath {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && isLanguageReturnPath(raw)) {
    return raw;
  }
  return '/login';
}

export function languagePageHref(returnTo: LanguageReturnPath): string {
  return `/language?from=${encodeURIComponent(returnTo)}`;
}
