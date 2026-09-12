import { type Locale, parseLocale } from '@/i18n/config';
import { AppError } from '@/lib/server/app-error';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { prisma } from '@/lib/server/prisma';
import { deleteS3Object } from '@/lib/server/s3';
import { revokeAllAuthSessions } from '@/lib/server/session';
import { VectorService } from '@/services/memory/vector.service';
import { API_ERROR_CODE } from '@/types/api-error';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PublicUser {
  id: string;
  username: string;
  nickname: string;
  hasAvatar: boolean;
  locale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const publicUserSelect = {
  id: true,
  username: true,
  nickname: true,
  avatarKey: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PublicUserRow = {
  id: string;
  username: string;
  nickname: string;
  avatarKey: string | null;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
};

/** 把库行转成公开用户（不暴露 avatarKey）。 */
export function toPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    hasAvatar: Boolean(row.avatarKey),
    locale: parseLocale(row.locale),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** 按 ID 查询用户（公开字段）。 */
export async function getUserById(id: string): Promise<PublicUser | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!row) return null;
  return toPublicUser(row);
}

/** 按 ID 取用户；不存在时 401（会话对应用户已失效）。 */
export async function requireUserById(id: string): Promise<PublicUser> {
  const user = await getUserById(id);
  if (!user) {
    throw AppError.unauthorized('用户不存在');
  }
  return user;
}

/** 按账号解析用户 ID；不存在时 404。 */
export async function resolveUserIdByUsername(username: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    throw AppError.notFound(`用户不存在: ${username}`);
  }

  return user.id;
}

/** 按账号查询用户（含密码哈希，仅供登录校验）。 */
async function findUserForAuth(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });
}

/** 校验账号密码；失败统一 401，成功返回 userId。 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<{ id: string }> {
  const user = await findUserForAuth(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw AppError.unauthorized('账号或密码错误', API_ERROR_CODE.INVALID_CREDENTIALS);
  }

  return { id: user.id };
}

/** 注册新用户。 */
export async function registerUser(input: {
  username: string;
  nickname: string;
  password: string;
  locale: Locale;
  timeZone: string;
}): Promise<{ id: string }> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true },
  });

  if (existing) {
    throw AppError.badRequest('账号已被占用', API_ERROR_CODE.USERNAME_TAKEN);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      nickname: input.nickname,
      passwordHash,
      locale: input.locale,
      timeZone: input.timeZone,
    },
    select: { id: true },
  });

  return user;
}

/** 聊天请求覆盖设备 IANA 时区；与当前值相同则不写库。 */
export async function persistUserTimeZone(userId: string, timeZone: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, timeZone: { not: timeZone } },
    data: { timeZone },
  });
}

/** 更新用户界面语言偏好。 */
export async function updateUserLocale(userId: string, locale: Locale): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { locale },
    select: publicUserSelect,
  });
  return toPublicUser(row);
}

/** 更新用户昵称。 */
export async function updateUserNickname(
  userId: string,
  nickname: string,
): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { nickname },
    select: publicUserSelect,
  });
  return toPublicUser(row);
}

/** 修改登录密码；成功后吊销该用户全部登录会话。 */
export async function changeUserPassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw AppError.unauthorized('用户不存在');
  }

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw AppError.unauthorized('当前密码错误', API_ERROR_CODE.INVALID_CURRENT_PASSWORD);
  }

  if (await verifyPassword(input.newPassword, user.passwordHash)) {
    throw AppError.badRequest('新密码不能与当前密码相同', API_ERROR_CODE.PASSWORD_UNCHANGED);
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await revokeAllAuthSessions(userId);
}

const vectorService = new VectorService();

/** 永久删除用户账号及其关联数据（不含 MemoryJob）。 */
export async function deleteUserAccount(userId: string, currentPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, avatarKey: true },
  });

  if (!user) {
    throw AppError.unauthorized('用户不存在');
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw AppError.unauthorized('当前密码错误', API_ERROR_CODE.INVALID_CURRENT_PASSWORD);
  }

  if (user.avatarKey) {
    await deleteS3Object(user.avatarKey);
  }
  await vectorService.deleteMemoriesByUserId(userId);
  await prisma.user.delete({ where: { id: userId } });
}
