export const PRIVACY_RETURN_PATHS = ['/register', '/me/settings'] as const;

export type PrivacyReturnPath = (typeof PRIVACY_RETURN_PATHS)[number];

export function isPrivacyReturnPath(value: string): value is PrivacyReturnPath {
  return (PRIVACY_RETURN_PATHS as readonly string[]).includes(value);
}

/** 解析隐私页回跳地址；非法或缺省时回落注册页。 */
export function parsePrivacyReturnTo(
  value: string | string[] | undefined | null,
): PrivacyReturnPath {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && isPrivacyReturnPath(raw)) {
    return raw;
  }
  return '/register';
}

export function privacyPageHref(returnTo: PrivacyReturnPath): string {
  return `/privacy?from=${encodeURIComponent(returnTo)}`;
}
