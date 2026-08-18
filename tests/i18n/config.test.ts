import { DEFAULT_LOCALE, isLocale, localeToHtmlLang, parseLocale } from '@/i18n/config';
import { describe, expect, it } from 'vitest';

describe('isLocale', () => {
  it('接受 en / zh', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh')).toBe(true);
  });

  it('拒绝其它值', () => {
    expect(isLocale('zh-CN')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale('fr')).toBe(false);
  });
});

describe('parseLocale', () => {
  it('解析合法值', () => {
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('zh')).toBe('zh');
  });

  it('无效或缺失时回落默认英文', () => {
    expect(parseLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(parseLocale(null)).toBe(DEFAULT_LOCALE);
    expect(parseLocale('')).toBe(DEFAULT_LOCALE);
    expect(parseLocale('ja')).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_LOCALE).toBe('en');
  });
});

describe('localeToHtmlLang', () => {
  it('映射到 html lang', () => {
    expect(localeToHtmlLang('en')).toBe('en');
    expect(localeToHtmlLang('zh')).toBe('zh-CN');
  });
});
