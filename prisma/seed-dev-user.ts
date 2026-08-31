import { env } from '../src/lib/server/env';
import { prisma } from '../src/lib/server/prisma';
import { registerUser } from '../src/services/user/users.service';

const SEED_USER = {
  username: 'tom',
  nickname: 'Tom',
  password: '123123123',
  locale: 'zh',
  timeZone: 'Asia/Shanghai',
} as const;

/** 仅非 production 灌入本地开发用户；已存在则跳过。 */
export async function seedDevUser(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { username: SEED_USER.username },
    select: { id: true },
  });
  if (!existing) {
    await registerUser(SEED_USER);
  }
}
