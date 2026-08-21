'use client';

import { formatMessage, getMessages } from '@/i18n/catalog';
import {
  type CharacterTField,
  type CharacterTranslationFn,
  tCharacter,
  type TranslationFn,
} from '@/i18n/characters';
import {
  DEFAULT_LOCALE,
  type Locale,
  localeFromBrowserLanguage,
  localeToHtmlLang,
} from '@/i18n/config';
import { getLocale, setLocale as persistLocale } from '@/i18n/locale-preference';
import type { Messages } from '@/i18n/messages/en';
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState(() => getMessages(DEFAULT_LOCALE));

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
    setMessages(getMessages(next));
    document.documentElement.lang = localeToHtmlLang(next);
  }, []);

  useEffect(() => {
    const next = getLocale() ?? localeFromBrowserLanguage(navigator.language);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 水合后按 Cookie / 浏览器语言对齐
    setLocale(next);
  }, [setLocale]);

  const value = useMemo(
    () => ({ locale, messages, setLocale }),
    [locale, messages, setLocale],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}

function useI18nContext(): I18nContextValue {
  const value = use(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return value;
}

/** 当前语言与切换。 */
export function useI18n(): Pick<I18nContextValue, 'locale' | 'setLocale'> {
  const { locale, setLocale } = useI18nContext();
  return { locale, setLocale };
}

/** 取某一命名空间下的文案；可选 `{key}` 插值。 */
export function useTranslations<N extends keyof Messages>(namespace: N): TranslationFn<N> {
  const { messages } = useI18nContext();
  const bag = messages[namespace];

  return useCallback(
    (key: keyof Messages[N] & string, params?: Record<string, string | number>) =>
      formatMessage(bag[key], params),
    [bag],
  );
}

/** 当前语言下按 slug 取角色 i18n 文案；缺 key 回退 slug。默认 displayName。 */
export function useTCharacter(): CharacterTranslationFn {
  const { locale } = useI18nContext();
  return useCallback(
    (slug: string, field: CharacterTField = 'displayName') => tCharacter(slug, field, locale),
    [locale],
  );
}
