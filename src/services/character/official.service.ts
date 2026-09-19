import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';

/** 官方 userId 进程内缓存；官方账号不存在时保持 undefined，下次重查。 */
let officialUserId: string | undefined;

/**
 * 角色是否属官方账号。
 * 官方角色的人设由 `prisma/characters.json` + seed 管理，不在 app 内编辑。
 */
export async function isOfficialCharacter(ownerId: string | null): Promise<boolean> {
  if (ownerId === null) {
    return false;
  }
  if (!officialUserId) {
    const row = await prisma.user.findUnique({
      where: { username: env.OFFICIAL_USERNAME },
      select: { id: true },
    });
    officialUserId = row?.id;
  }
  return ownerId === officialUserId;
}
