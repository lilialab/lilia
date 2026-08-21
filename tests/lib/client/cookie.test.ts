import { CLIENT_COOKIE_PREFIX, deleteCookie, getCookie, setCookie } from '@/lib/client/cookie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jar = new Map<string, string>();

describe('lib/client/cookie', () => {
  beforeEach(() => {
    jar.clear();
    vi.stubGlobal('document', {
      get cookie() {
        return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
      },
      set cookie(entry: string) {
        const [pair] = entry.split(';');
        if (!pair) return;
        const eq = pair.indexOf('=');
        const name = pair.slice(0, eq);
        const value = pair.slice(eq + 1);
        if (entry.includes('Max-Age=0')) {
          jar.delete(name);
          return;
        }
        jar.set(name, value);
      },
    });
    vi.stubGlobal('location', { protocol: 'http:' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('自动加 pai_ 前缀', () => {
    setCookie('test', 'hello', { maxAgeSeconds: 60 });
    expect(jar.has(`${CLIENT_COOKIE_PREFIX}test`)).toBe(true);
    expect(getCookie('test')).toBe('hello');
  });

  it('已带前缀时不重复加', () => {
    setCookie('pai_already', 'x', { maxAgeSeconds: 60 });
    expect(jar.has('pai_already')).toBe(true);
    expect(jar.has('pai_pai_already')).toBe(false);
    expect(getCookie('pai_already')).toBe('x');
  });

  it('缺失时为 undefined', () => {
    expect(getCookie('missing_xyz')).toBeUndefined();
  });

  it('delete 后读不到', () => {
    setCookie('del', 'x', { maxAgeSeconds: 60 });
    deleteCookie('del');
    expect(getCookie('del')).toBeUndefined();
  });
});
