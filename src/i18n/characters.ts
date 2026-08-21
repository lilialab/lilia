import { getMessages } from './catalog';
import type { Locale } from './config';
import type { Messages } from './messages/en';

export type CharacterTField = 'displayName' | 'shortBio';

/** `useTranslations(namespace)` 的回调签名。 */
export type TranslationFn<N extends keyof Messages> = (
  key: keyof Messages[N] & string,
  params?: Record<string, string | number>,
) => string;

/** `useTCharacter()` 的回调签名。 */
export type CharacterTranslationFn = (
  slug: string,
  field?: CharacterTField,
) => string;

/** 按 slug 与语言取角色 i18n 文案；缺 key 回退 slug。 */
export function tCharacter(
  slug: string,
  field: CharacterTField,
  locale: Locale,
): string {
  const bag = getMessages(locale).characters;
  const key = `${slug}.${field}`;
  if (Object.hasOwn(bag, key)) {
    return bag[key as keyof Messages['characters']];
  }
  return slug;
}
