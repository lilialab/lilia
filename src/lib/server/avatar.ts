import { AppError } from '@/lib/server/app-error';
import { API_ERROR_CODE } from '@/types/api-error';
import { AVATAR_MAX_BYTES, type AvatarImageKind, sniffAvatarImage } from '@/utils/avatar';

/** 校验头像字节；通过则返回格式。 */
export function assertAvatarBytes(bytes: Uint8Array): AvatarImageKind {
  if (bytes.byteLength === 0) {
    throw AppError.badRequest('请选择图片', API_ERROR_CODE.AVATAR_REQUIRED);
  }
  if (bytes.byteLength > AVATAR_MAX_BYTES) {
    throw AppError.badRequest('图片不能超过 5MB', API_ERROR_CODE.AVATAR_TOO_LARGE);
  }
  const kind = sniffAvatarImage(bytes);
  if (!kind) {
    throw AppError.badRequest('仅支持 jpeg、png、webp', API_ERROR_CODE.AVATAR_INVALID_TYPE);
  }
  return kind;
}
