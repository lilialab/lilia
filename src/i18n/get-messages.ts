import type { Locale } from './config';
import { en, type Messages } from './messages/en';
import { zh } from './messages/zh';

const catalogs: Record<Locale, Messages> = {
  en,
  zh,
};

/** 按语言取文案目录。 */
export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}
