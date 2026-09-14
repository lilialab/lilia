export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export type AvatarImageKind = 'jpeg' | 'png' | 'webp';

export const AVATAR_CONTENT_TYPES: Record<AvatarImageKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const AVATAR_EXTENSIONS: Record<AvatarImageKind, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

/** 按文件头识别 jpeg / png / webp；其它格式返回 null。 */
export function sniffAvatarImage(bytes: Uint8Array): AvatarImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 12
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

/** 生成头像对象 key。dir 如 `avatars/${userId}`。 */
export function buildAvatarObjectKey(
  dir: string,
  kind: AvatarImageKind,
  id = crypto.randomUUID(),
): string {
  return `${dir}/${id}.${AVATAR_EXTENSIONS[kind]}`;
}
