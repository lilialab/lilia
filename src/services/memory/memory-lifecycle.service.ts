import { randomUUID } from 'crypto';
import { prisma } from '@/lib/server/prisma';
import { VectorService } from '@/services/memory/vector.service';
import type { MemoryType } from '@/types/memory';

const vectorService = new VectorService();

export interface CreateUserMemoryInput {
  id?: string;
  userId: string;
  text: string;
  type: MemoryType;
  confidence: number;
}

export type CreateMaintainedMemoryInput = Omit<CreateUserMemoryInput, 'id'>;

export interface CreateUserMemoriesOptions {
  isMaintained?: boolean;
  lastActiveAt?: Date;
}

interface UserMemoryChromaRecord {
  id: string;
  text: string;
  timestamp: number;
  type: MemoryType;
  confidence: number;
  lastActiveAt: number;
}

interface PreparedUserMemoryWrite {
  ids: string[];
  mysqlRows: {
    id: string;
    userId: string;
    text: string;
    type: MemoryType;
    confidence: number;
    isMaintained: boolean;
    lastActiveAt: Date;
  }[];
  chromaRecords: UserMemoryChromaRecord[];
}

export interface MemoryMergeUpdate {
  keeperId: string;
  removedIds: string[];
  text: string;
  type: MemoryType;
  confidence: number;
}

export interface ApplyMaintenanceMergeInput {
  deleteIds: string[];
  newMemories: CreateMaintainedMemoryInput[];
}

/** 为 MySQL + Chroma 双写准备统一时间戳与行结构。 */
function prepareUserMemoryWrite(
  inputs: CreateUserMemoryInput[],
  options?: CreateUserMemoriesOptions,
): PreparedUserMemoryWrite {
  const lastActiveAt = options?.lastActiveAt ?? new Date();
  const isMaintained = options?.isMaintained ?? false;
  const timestamp = lastActiveAt.getTime();

  const ids: string[] = [];
  const mysqlRows: PreparedUserMemoryWrite['mysqlRows'] = [];
  const chromaRecords: UserMemoryChromaRecord[] = [];

  inputs.forEach((input) => {
    const id = input.id ?? randomUUID();
    ids.push(id);
    mysqlRows.push({
      id,
      userId: input.userId,
      text: input.text,
      type: input.type,
      confidence: input.confidence,
      isMaintained,
      lastActiveAt,
    });
    chromaRecords.push({
      id,
      text: input.text,
      timestamp,
      type: input.type,
      confidence: input.confidence,
      lastActiveAt: timestamp,
    });
  });

  return { ids, mysqlRows, chromaRecords };
}

/** 构建 UserMemory MySQL + Chroma 写入载荷（不写库）。 */
export function buildUserMemoryWritePayload(
  inputs: CreateUserMemoryInput[],
  options?: CreateUserMemoriesOptions,
): PreparedUserMemoryWrite {
  return prepareUserMemoryWrite(inputs, options);
}

/** 将记忆向量同步到 Chroma（事务提交后调用）。 */
export async function syncUserMemoriesToChroma(records: UserMemoryChromaRecord[]): Promise<void> {
  if (records.length === 0) return;
  await vectorService.addMemories(records);
}

/** 批量创建 UserMemory 并写入 Chroma。 */
export async function createUserMemories(
  inputs: CreateUserMemoryInput[],
  options?: CreateUserMemoriesOptions,
): Promise<{ ids: string[] }> {
  if (inputs.length === 0) return { ids: [] };

  const prepared = prepareUserMemoryWrite(inputs, options);
  await prisma.userMemory.createMany({ data: prepared.mysqlRows });
  await syncUserMemoriesToChroma(prepared.chromaRecords);
  return { ids: prepared.ids };
}

/** 软删除记忆并同步移除 Chroma 向量。先 MySQL 后 Chroma；若 Chroma 删失败，RAG 侧靠 MySQL 二次过滤兜底。 */
export async function softDeleteMemories(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  await prisma.userMemory.updateMany({
    where: { id: { in: ids }, isDeleted: false },
    data: { isDeleted: true },
  });

  await vectorService.deleteMemories(ids);
}

/** 更新 MySQL 记忆并同步 Chroma 向量。 */
export async function updateMemoryRecord(input: {
  id: string;
  text: string;
  type: MemoryType;
  confidence: number;
  lastActiveAt?: Date;
}): Promise<void> {
  const lastActiveAt = input.lastActiveAt ?? new Date();

  const row = await prisma.userMemory.update({
    where: { id: input.id },
    data: {
      text: input.text,
      type: input.type,
      confidence: input.confidence,
      lastActiveAt,
    },
  });

  await vectorService.updateMemory({
    id: row.id,
    text: row.text,
    type: input.type,
    confidence: row.confidence,
    lastActiveAt: row.lastActiveAt.getTime(),
    timestamp: row.createdAt.getTime(),
  });
}

/** 合并记忆：更新 keeper，软删其余条目。 */
export async function applyMemoryMerge(input: MemoryMergeUpdate): Promise<void> {
  const removedIds = input.removedIds.filter((id) => id !== input.keeperId);
  await updateMemoryRecord({
    id: input.keeperId,
    text: input.text,
    type: input.type,
    confidence: input.confidence,
  });
  await softDeleteMemories(removedIds);
}

/** 标记单条记忆已完成维护（无合并或作为游标已消费）。 */
export async function markMemoryMaintained(id: string): Promise<void> {
  await prisma.userMemory.updateMany({
    where: { id, isDeleted: false, isMaintained: false },
    data: { isMaintained: true },
  });
}

/** 创建维护产出的新记忆（isMaintained=true）并写入 Chroma。 */
export async function createMaintainedMemory(
  input: CreateMaintainedMemoryInput,
): Promise<{ id: string }> {
  const { ids } = await createUserMemories([input], { isMaintained: true });
  const id = ids[0];
  if (!id) {
    throw new Error('createUserMemories returned no id');
  }
  return { id };
}

/**
 * 维护整理：输入簇全删 + 批量新建。
 * MySQL 软删与 createMany 同事务；Chroma 在事务提交后同步，与 extract 路径一致。
 */
export async function applyMaintenanceMerge(
  input: ApplyMaintenanceMergeInput,
): Promise<{ ids: string[] }> {
  const uniqueDeleteIds = [...new Set(input.deleteIds)];
  const prepared = prepareUserMemoryWrite(input.newMemories, { isMaintained: true });

  if (prepared.mysqlRows.length === 0) {
    throw new Error('applyMaintenanceMerge requires at least one new memory');
  }

  await prisma.$transaction(async (tx) => {
    if (uniqueDeleteIds.length > 0) {
      await tx.userMemory.updateMany({
        where: { id: { in: uniqueDeleteIds }, isDeleted: false },
        data: { isDeleted: true },
      });
    }
    await tx.userMemory.createMany({ data: prepared.mysqlRows });
  });

  if (uniqueDeleteIds.length > 0) {
    await vectorService.deleteMemories(uniqueDeleteIds);
  }
  await syncUserMemoriesToChroma(prepared.chromaRecords);

  return { ids: prepared.ids };
}
