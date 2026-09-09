import type { Locale } from './config';
import { en, type Messages } from './messages/en';
import { ja } from './messages/ja';
import { zh } from './messages/zh';

const catalogs: Record<Locale, Messages> = {
  en,
  zh,
  ja,
};

/** 按语言取文案目录。 */
export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

/** 将文案中的 `{key}` 替换为 params 对应值；缺省则保留占位符。 */
export function formatMessage(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}
