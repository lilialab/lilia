import {
  AVATAR_MAX_BYTES,
  buildAvatarObjectKey,
  sniffAvatarImage,
} from '@/services/user/avatar.utils';
import { describe, expect, it } from 'vitest';

function bytes(...values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

describe('sniffAvatarImage', () => {
  it('识别 jpeg / png / webp', () => {
    expect(sniffAvatarImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
    expect(sniffAvatarImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
    expect(
      sniffAvatarImage(
        bytes(
          0x52,
          0x49,
          0x46,
          0x46,
          0x00,
          0x00,
          0x00,
          0x00,
          0x57,
          0x45,
          0x42,
          0x50,
        ),
      ),
    ).toBe('webp');
  });

  it('拒绝 gif、过短或空内容', () => {
    expect(sniffAvatarImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBeNull();
    expect(sniffAvatarImage(bytes(0xff, 0xd8))).toBeNull();
    expect(sniffAvatarImage(new Uint8Array())).toBeNull();
  });
});

describe('buildAvatarObjectKey', () => {
  it('按用户与扩展名拼 key', () => {
    expect(buildAvatarObjectKey('user-1', 'jpeg', 'abc')).toBe('avatars/user-1/abc.jpg');
    expect(buildAvatarObjectKey('user-1', 'png', 'abc')).toBe('avatars/user-1/abc.png');
    expect(buildAvatarObjectKey('user-1', 'webp', 'abc')).toBe('avatars/user-1/abc.webp');
  });
});

describe('AVATAR_MAX_BYTES', () => {
  it('为 5MB', () => {
    expect(AVATAR_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
