import { type Locale, parseLocale } from '@/i18n/config';
import { AppError } from '@/lib/server/app-error';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { prisma } from '@/lib/server/prisma';
import { ensureArborContact } from '@/services/character/contacts.service';
import { API_ERROR_CODE } from '@/types/api-error';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  locale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
  return { ...row, locale: parseLocale(row.locale) };
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
  displayName: string;
  password: string;
  locale: Locale;
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
      displayName: input.displayName,
      passwordHash,
      locale: input.locale,
    },
    select: { id: true },
  });

  await ensureArborContact(user.id);
  return user;
}

/** 更新用户界面语言偏好。 */
export async function updateUserLocale(userId: string, locale: Locale): Promise<PublicUser> {
  const row = await prisma.user.update({
    where: { id: userId },
    data: { locale },
    select: publicUserSelect,
  });
  return { ...row, locale: parseLocale(row.locale) };
}
