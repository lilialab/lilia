import { parsePrivacyReturnTo, privacyPageHref } from '@/app/privacy/privacy-return';
import { describe, expect, it } from 'vitest';

describe('parsePrivacyReturnTo', () => {
  it('接受白名单路径', () => {
    expect(parsePrivacyReturnTo('/register')).toBe('/register');
    expect(parsePrivacyReturnTo('/me/settings')).toBe('/me/settings');
  });

  it('拒绝开放跳转并回落注册页', () => {
    expect(parsePrivacyReturnTo('https://evil.example')).toBe('/register');
    expect(parsePrivacyReturnTo('/contacts')).toBe('/register');
    expect(parsePrivacyReturnTo(undefined)).toBe('/register');
    expect(parsePrivacyReturnTo(null)).toBe('/register');
  });
});

describe('privacyPageHref', () => {
  it('带上 from 查询参数', () => {
    expect(privacyPageHref('/register')).toBe('/privacy?from=%2Fregister');
    expect(privacyPageHref('/me/settings')).toBe('/privacy?from=%2Fme%2Fsettings');
  });
});
