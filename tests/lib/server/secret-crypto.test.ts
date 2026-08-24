import { decryptSecret, encryptSecret } from '@/lib/server/secret-crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/env', () => ({
  env: {
    AUTH_SESSION_SECRET: 'test-session-secret',
  },
}));

describe('secret-crypto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encryptSecret 与 decryptSecret 可往返', () => {
    const cipher = encryptSecret('sk-test-key');
    expect(cipher).not.toContain('sk-test-key');
    expect(decryptSecret(cipher)).toBe('sk-test-key');
  });

  it('每次加密的密文不同', () => {
    expect(encryptSecret('sk-test-key')).not.toBe(encryptSecret('sk-test-key'));
  });

  it('篡改密文后解密失败', () => {
    const cipher = encryptSecret('sk-test-key');
    const tampered = `${cipher.slice(0, -1)}${cipher.endsWith('A') ? 'B' : 'A'}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
