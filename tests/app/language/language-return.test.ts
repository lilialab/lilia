import { languagePageHref, parseLanguageReturnTo } from '@/app/language/language-return';
import { describe, expect, it } from 'vitest';

describe('parseLanguageReturnTo', () => {
  it('接受白名单路径', () => {
    expect(parseLanguageReturnTo('/login')).toBe('/login');
    expect(parseLanguageReturnTo('/register')).toBe('/register');
    expect(parseLanguageReturnTo('/me/settings')).toBe('/me/settings');
  });

  it('拒绝开放跳转并回落登录页', () => {
    expect(parseLanguageReturnTo('https://evil.example')).toBe('/login');
    expect(parseLanguageReturnTo('/contacts')).toBe('/login');
    expect(parseLanguageReturnTo(undefined)).toBe('/login');
    expect(parseLanguageReturnTo(null)).toBe('/login');
  });
});

describe('languagePageHref', () => {
  it('带上 from 查询参数', () => {
    expect(languagePageHref('/login')).toBe('/language?from=%2Flogin');
    expect(languagePageHref('/me/settings')).toBe('/language?from=%2Fme%2Fsettings');
  });
});
