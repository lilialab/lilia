import type { Prisma } from '@/generated/prisma/client';
import { type Locale, parseLocale } from '@/i18n/config';
import { AppError } from '@/lib/server/app-error';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { prisma } from '@/lib/server/prisma';
import { deleteS3Object } from '@/lib/server/s3';
import { revokeAllAuthSessions } from '@/lib/server/session';
import { VectorService } from '@/services/memory/vector.service';
import { ANONYMOUS_ACCOUNT_MESSAGE } from '@/services/user/anonymous-account';
import { API_ERROR_CODE } from '@/types/api-error';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PublicUser {
  id: string;
  account: string;
  nickname: string;
  hasAvatar: boolean;
  /** 是否已设密码；false 表示匿名账号（未「保存账号」） */
  hasPassword: boolean;
  locale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const publicUserSelect = {
  id: true,
  account: true,
  nickname: true,
  avatarKey: true,
  passwordHash: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type PublicUserRow = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

/** 把库行转成公开用户（不暴露 avatarKey）。 */
export function toPublicUser(row: PublicUserRow): PublicUser {
  return {
    id: row.id,
    account: row.account,
    nickname: row.nickname,
    hasAvatar: Boolean(row.avatarKey),
    hasPassword: row.passwordHash !== null,
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
export async function resolveUserIdByAccount(account: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { account },
    select: { id: true },
  });

  if (!user) {
    throw AppError.notFound(`用户不存在: ${account}`);
  }

  return user.id;
}

/** 按账号查询用户（含密码哈希，仅供登录校验）。 */
async function findUserForAuth(account: string) {
  return prisma.user.findUnique({
    where: { account },
    select: { id: true, passwordHash: true },
  });
}

/** 校验账号密码；失败 400，成功返回 userId。 */
export async function authenticateUser(
  account: string,
  password: string,
): Promise<{ id: string }> {
  const user = await findUserForAuth(account);
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw AppError.badRequest('账号或密码错误', API_ERROR_CODE.INVALID_CREDENTIALS);
  }

  return { id: user.id };
}

/** 注册新用户。 */
export async function registerUser(input: {
  account: string;
  nickname: string;
  password: string;
  locale: Locale;
  timeZone: string;
}): Promise<{ id: string }> {
  const existing = await prisma.user.findUnique({
    where: { account: input.account },
    select: { id: true },
  });

  if (existing) {
    throw AppError.badRequest('账号已被占用', API_ERROR_CODE.ACCOUNT_TAKEN);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      account: input.account,
      nickname: input.nickname,
      passwordHash,
      locale: input.locale,
      timeZone: input.timeZone,
    },
    select: { id: true },
  });

  return user;
}

/** 创建匿名用户；不设密码（passwordHash 空），后续由「保存账号」补上。 */
export async function createAnonymousUser(input: {
  account: string;
  nickname: string;
  locale: Locale;
  timeZone: string;
}): Promise<{ id: string }> {
  const user = await prisma.user.create({
    data: {
      account: input.account,
      nickname: input.nickname,
      passwordHash: null,
      locale: input.locale,
      timeZone: input.timeZone,
    },
    select: { id: true },
  });

  return user;
}

/** 把匿名账号升级为可登录的真账号：补密码、可改账号名与昵称，仍落在同一个 userId 上。 */
export async function upgradeAnonymousAccount(
  userId: string,
  input: { account: string; nickname: string; password: string },
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw AppError.unauthorized('用户不存在');
  }

  if (user.passwordHash !== null) {
    throw AppError.conflict('该账号已设置密码');
  }

  const occupied = await prisma.user.findUnique({
    where: { account: input.account },
    select: { id: true },
  });

  if (occupied && occupied.id !== userId) {
    throw AppError.badRequest('账号已被占用', API_ERROR_CODE.ACCOUNT_TAKEN);
  }

  const passwordHash = await hashPassword(input.password);

  // 条件写：把「仍是匿名」压在 update 的 where 上，避免并发请求重复升级
  const updated = await prisma.user.updateMany({
    where: { id: userId, passwordHash: null },
    data: { account: input.account, nickname: input.nickname, passwordHash },
  });

  if (updated.count === 0) {
    throw AppError.conflict('该账号已设置密码');
  }
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

  if (!user.passwordHash) {
    throw AppError.forbidden(ANONYMOUS_ACCOUNT_MESSAGE);
  }

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw AppError.badRequest('当前密码错误', API_ERROR_CODE.INVALID_CURRENT_PASSWORD);
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

/** 永久删除用户账号及其关联数据（不含 MemoryJob；其创建的角色保留，owner 置空）。 */
export async function deleteUserAccount(userId: string, currentPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, avatarKey: true },
  });

  if (!user) {
    throw AppError.unauthorized('用户不存在');
  }

  if (!user.passwordHash) {
    throw AppError.forbidden(ANONYMOUS_ACCOUNT_MESSAGE);
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw AppError.badRequest('当前密码错误', API_ERROR_CODE.INVALID_CURRENT_PASSWORD);
  }

  if (user.avatarKey) {
    await deleteS3Object(user.avatarKey);
  }
  await vectorService.deleteMemoriesByUserId(userId);
  await prisma.user.delete({ where: { id: userId } });
}
