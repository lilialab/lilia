import { prisma } from '@/lib/server/prisma';
import { hashPassword } from '@/lib/server/password';
import { AppError } from '@/lib/server/app-error';

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  timeZone: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** 按 ID 查询用户（公开字段）。 */
export async function getUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
}

/** 读取用户 IANA 时区；用户不存在时 404。 */
export async function getUserTimeZone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timeZone: true },
  });

  if (!user) {
    throw AppError.notFound('用户不存在');
  }

  return user.timeZone;
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
export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      passwordHash: true,
    },
  });
}

/** 注册新用户。 */
export async function registerUser(input: {
  username: string;
  displayName: string;
  password: string;
  timeZone: string;
}): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true },
  });

  if (existing) {
    throw AppError.badRequest('账号已被占用');
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      username: input.username,
      displayName: input.displayName,
      passwordHash,
      timeZone: input.timeZone,
    },
    select: publicUserSelect,
  });
}
