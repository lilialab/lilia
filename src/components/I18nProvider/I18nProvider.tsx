'use client';

import { type Locale, localeToHtmlLang } from '@/i18n/config';
import { writeLocaleCookie } from '@/i18n/cookie';
import { formatMessage } from '@/i18n/format-message';
import { getMessages } from '@/i18n/get-messages';
import type { Messages } from '@/i18n/messages/en';
import { createContext, type ReactNode, use, useCallback, useMemo, useState } from 'react';

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}

export function I18nProvider(
  { locale: initialLocale, messages: initialMessages, children }: I18nProviderProps,
) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  const setLocale = useCallback((next: Locale) => {
    writeLocaleCookie(next);
    setLocaleState(next);
    setMessages(getMessages(next));
    document.documentElement.lang = localeToHtmlLang(next);
  }, []);

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
export function useTranslations<N extends keyof Messages>(namespace: N) {
  const { messages } = useI18nContext();
  const bag = messages[namespace];

  return useCallback(
    (key: keyof Messages[N] & string, params?: Record<string, string | number>) =>
      formatMessage(bag[key], params),
    [bag],
  );
}
