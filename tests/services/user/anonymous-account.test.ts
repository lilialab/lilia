import {
  generateAnonymousAccount,
  generateAnonymousNickname,
} from '@/services/user/anonymous-account';
import { describe, expect, it } from 'vitest';

describe('generateAnonymousAccount', () => {
  it('生成 u_ 前缀 + 定长随机体，且只含非易混字符', () => {
    const account = generateAnonymousAccount();

    expect(account).toMatch(/^u_[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10}$/);
  });

  it('多次生成不重复', () => {
    const accounts = new Set(Array.from({ length: 200 }, () => generateAnonymousAccount()));

    expect(accounts.size).toBe(200);
  });
});

describe('generateAnonymousNickname', () => {
  it('由形容词与名词拼成', () => {
    const nickname = generateAnonymousNickname();

    expect(nickname.length).toBeGreaterThan(1);
    expect(nickname).not.toContain('undefined');
  });
});
