import { hashPassword, verifyPassword } from '@/lib/server/password';
import { describe, expect, it } from 'vitest';

describe('password', () => {
  it('hashPassword 与 verifyPassword 可正确校验', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(await verifyPassword('password123', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
