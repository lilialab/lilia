import { getMessages } from '@/i18n/catalog';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { getLocale } from '@/i18n/locale-preference';
import { type ApiErrorCode, isApiErrorCode } from '@/types/api-error';

type TranslateError = (key: ApiErrorCode | 'fallback') => string;

function catalogTranslate(key: ApiErrorCode | 'fallback'): string {
  const locale = getLocale();
  if (locale) {
    return getMessages(locale).errors[key];
  }
  return getMessages(DEFAULT_LOCALE).errors[key];
}

function readErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string'
  ) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

/** 按稳定 code 翻成当前语言；可传入 t，省略则 getLocale()。未知码回退到 error.message 或 fallback。 */
export function translateApiError(error: unknown, t: TranslateError = catalogTranslate): string {
  const code = readErrorCode(error);
  if (isApiErrorCode(code)) {
    return t(code);
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return t('fallback');
}
