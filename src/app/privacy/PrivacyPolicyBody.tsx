'use client';

import { useI18n } from '@/components/I18nProvider';
import type { Locale } from '@/i18n/config';
import type { ComponentType } from 'react';
import { PrivacyPolicyEn } from './bodies/en';
import { PrivacyPolicyZh } from './bodies/zh';

const bodies: Record<Locale, ComponentType> = {
  en: PrivacyPolicyEn,
  zh: PrivacyPolicyZh,
};

/** 按当前界面语言展示隐私说明。 */
export function PrivacyPolicyBody() {
  const { locale } = useI18n();
  const Body = bodies[locale];
  return <Body />;
}
