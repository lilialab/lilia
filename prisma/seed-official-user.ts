import { env } from '../src/lib/server/env';
import { prisma } from '../src/lib/server/prisma';
import { registerUser } from '../src/services/user/users.service';

/** 确保官方账号存在；已有则返回其 id。生产也跑（目录角色要挂靠）。 */
export async function seedOfficialUser(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { username: env.OFFICIAL_USERNAME },
    select: { id: true },
  });
  if (existing) return existing.id;

  const user = await registerUser({
    username: env.OFFICIAL_USERNAME,
    nickname: env.OFFICIAL_USERNAME,
    password: env.OFFICIAL_PASSWORD,
    locale: 'zh',
    timeZone: 'Asia/Shanghai',
  });
  return user.id;
}
