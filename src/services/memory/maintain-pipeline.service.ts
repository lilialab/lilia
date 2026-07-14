import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/server/prisma';
import { prepareConsolidationJob } from './job.service';
import { runMaintenance } from './maintenance.service';
import { runProfileRefresh } from './user-profile.service';

/** 读取上次 maintain→profile 管线全部成功的时刻；从未成功则为 null。 */
export async function getLastMemoryPipelineAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastMemoryPipelineAt: true },
  });
  return user?.lastMemoryPipelineAt ?? null;
}

/** 管线（maintain + profile）都成功后写入完成时刻。 */
export async function updateLastMemoryPipelineAt(userId: string, at: Date): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastMemoryPipelineAt: at },
  });
}

/**
 * 单用户串行：先记忆维护，成功后再画像；两者都成功才更新 User.lastMemoryPipelineAt。
 * maintain 或 profile 抛错则不更新时钟。
 */
export async function runMaintainPipelineForUser(userId: string): Promise<void> {
  const maintainJob = await prepareConsolidationJob(randomUUID(), 'maintain');
  await runMaintenance(maintainJob, userId);

  const profileJob = await prepareConsolidationJob(randomUUID(), 'profile');
  await runProfileRefresh(profileJob, userId);

  await updateLastMemoryPipelineAt(userId, new Date());
}
