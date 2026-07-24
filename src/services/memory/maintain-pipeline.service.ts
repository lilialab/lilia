import { prisma } from '@/lib/server/prisma';
import { randomUUID } from 'node:crypto';
import { prepareConsolidationJob } from './job.service';
import { runMaintenance } from './maintenance.service';
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
export async function updateLastMemoryPipelineAt(
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
 * 单用户×角色串行：先该角色记忆维护，成功后再该角色画像；两者都成功才更新 UserCharacter.lastMemoryPipelineAt。
 * maintain 或 profile 抛错则不更新时钟。
 */
export async function runMaintainPipelineForUserCharacter(
  userId: string,
  characterId: string,
): Promise<void> {
  const maintainJob = await prepareConsolidationJob(randomUUID(), 'maintain');
  await runMaintenance(maintainJob, userId, characterId);

  const profileJob = await prepareConsolidationJob(randomUUID(), 'profile');
  await runProfileRefresh(profileJob, userId, characterId);

  await updateLastMemoryPipelineAt(userId, characterId, new Date());
}
