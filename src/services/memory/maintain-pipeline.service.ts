import { prisma } from '@/lib/server/prisma';
import { randomUUID } from 'node:crypto';
import { prepareMemoryJob } from './job.service';
import { runMaintain } from './maintain.service';
import { runProfileRefresh } from './user-profile.service';

/** 读取该用户×角色上次 maintain→profile 管线全部成功的时刻；从未成功则为 null。 */
export async function getLastMemoryPipelineAt(
  userId: string,
  characterId: string,
): Promise<Date | null> {
  const row = await prisma.userCharacter.findUnique({
    where: { userId_characterId: { userId, characterId } },
    select: { lastMemoryPipelineAt: true },
  });
  return row?.lastMemoryPipelineAt ?? null;
}

/** 管线（maintain + profile）都成功后写入该用户×角色的完成时刻。 */
async function updateLastMemoryPipelineAt(
  userId: string,
  characterId: string,
  at: Date,
): Promise<void> {
  await prisma.userCharacter.update({
    where: { userId_characterId: { userId, characterId } },
    data: { lastMemoryPipelineAt: at },
  });
}

/**
 * 单用户×角色串行：先维护记忆再刷新画像。
 * maintain 或 profile 抛错则中断，不更新时钟。
 */
export async function runMaintainPipelineForUserCharacter(
  userId: string,
  characterId: string,
): Promise<void> {
  const maintainJob = await prepareMemoryJob(randomUUID(), 'maintain');
  await runMaintain(maintainJob, userId, characterId);

  const profileJob = await prepareMemoryJob(randomUUID(), 'profile');
  await runProfileRefresh(profileJob, userId, characterId);

  await updateLastMemoryPipelineAt(userId, characterId, new Date());
}
