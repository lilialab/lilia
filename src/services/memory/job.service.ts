import type { InputJsonValue } from '@prisma/client/runtime/client';
import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import { AppError } from '@/lib/server/app-error';
import type {
  ConsolidationJob,
  ConsolidationJobSnapshot,
  JobKind,
  JobStatus,
} from '@/types/consolidation-job';

/** 将未知值断言为 Prisma JSON 输入类型。 */
function toInputJsonValue(value: unknown): InputJsonValue {
  return value as InputJsonValue;
}

/** 将数据库行映射为 ConsolidationJob 领域对象。 */
function toConsolidationJob(row: {
  id: string;
  kind: string;
  status: string;
  progress: string;
  error: string | null;
  result: unknown;
  snapshot: unknown;
  startedAt: Date;
  completedAt: Date | null;
}): ConsolidationJob {
  return {
    id: row.id,
    kind: row.kind as JobKind,
    status: row.status as JobStatus,
    startedAt: row.startedAt.getTime(),
    completedAt: row.completedAt?.getTime(),
    progress: row.progress,
    error: row.error ?? undefined,
    result: (row.result as ConsolidationJob['result']) ?? undefined,
    snapshot: (row.snapshot as ConsolidationJobSnapshot) ?? undefined,
  };
}

/** 创建 pending 状态的记忆任务。 */
export async function createConsolidationJob(
  id: string,
  kind: JobKind = 'extract',
): Promise<ConsolidationJob> {
  const row = await prisma.consolidationJob.create({
    data: {
      id,
      kind,
      status: 'pending',
      progress: '等待开始...',
    },
  });

  return toConsolidationJob(row);
}

/** 按 id 查询任务，不存在时返回 undefined。 */
export async function getConsolidationJob(id: string): Promise<ConsolidationJob | undefined> {
  const row = await prisma.consolidationJob.findUnique({ where: { id } });
  return row ? toConsolidationJob(row) : undefined;
}

/** 按 id 查询任务；不存在时 404。 */
export async function getConsolidationJobOrThrow(id: string): Promise<ConsolidationJob> {
  const job = await getConsolidationJob(id);
  if (!job) {
    throw AppError.notFound('找不到对应的任务，可能已过期');
  }
  return job;
}

/** 部分更新任务字段；任务不存在时静默跳过。 */
export async function updateConsolidationJob(
  id: string,
  patch: Partial<ConsolidationJob>,
): Promise<void> {
  const existing = await prisma.consolidationJob.findUnique({ where: { id } });
  if (!existing) return;

  const data: {
    kind?: string;
    status?: string;
    progress?: string;
    error?: string | null;
    result?: InputJsonValue;
    snapshot?: InputJsonValue;
    completedAt?: Date | null;
  } = {};

  if (patch.kind !== undefined) data.kind = patch.kind;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.progress !== undefined) data.progress = patch.progress;
  if (patch.error !== undefined) data.error = patch.error;
  if (patch.result !== undefined) {
    data.result = toInputJsonValue(patch.result);
  }
  if (patch.completedAt !== undefined) {
    data.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
  }
  if (patch.snapshot !== undefined) {
    const previous = (existing.snapshot ?? {}) as ConsolidationJobSnapshot;
    const definedEntries = Object.entries(patch.snapshot).filter(([, value]) => value !== undefined);
    data.snapshot = toInputJsonValue({
      ...previous,
      ...Object.fromEntries(definedEntries),
    });
  }

  await prisma.consolidationJob.update({ where: { id }, data });
}

/** 保留最近 CONSOLIDATION_JOB_MAX_HISTORY 条记录，防止无限增长 */
export async function pruneConsolidationJobs(): Promise<void> {
  const staleJobs = await prisma.consolidationJob.findMany({
    orderBy: { startedAt: 'desc' },
    select: { id: true },
    skip: env.CONSOLIDATION_JOB_MAX_HISTORY,
  });

  if (staleJobs.length === 0) return;

  await prisma.consolidationJob.deleteMany({
    where: { id: { in: staleJobs.map((job) => job.id) } },
  });
}

/** 创建任务并清理过期记录 */
export async function prepareConsolidationJob(
  id: string,
  kind: JobKind = 'extract',
): Promise<ConsolidationJob> {
  const job = await createConsolidationJob(id, kind);
  await pruneConsolidationJobs();
  return job;
}
