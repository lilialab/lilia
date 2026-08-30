import { chromaClient, getEmbeddingFunction } from '@/lib/server/chroma';
import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import type { MemoryType } from '@/types/memory';
import type { Where } from 'chromadb';
import { effectiveScore } from './decay.utils';
import { parseMemoryMetadata } from './metadata.utils';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AddMemoryInput {
  id: string;
  userId: string;
  characterId: string;
  text: string;
  timestamp: number;
  type: MemoryType;
  confidence: number;
  lastActiveAt: number;
}

export interface UpdateMemoryInput {
  id: string;
  userId: string;
  characterId: string;
  text: string;
  timestamp: number;
  type: MemoryType;
  confidence: number;
  lastActiveAt: number;
}

export interface MemoryNeighbor {
  id: string;
  distance: number;
}

export interface MemoryCandidate {
  id: string;
  text: string;
  confidence: number;
  lastActiveAt: number;
  distance: number;
  type?: MemoryType;
}

interface QueryMemoryWithDecayOptions {
  userId: string;
  characterId: string;
  startTime?: number;
  nowMs?: number;
  candidateMultiplier?: number;
}

interface FindMemoryNeighborsOptions {
  userId: string;
  characterId: string;
  excludeId?: string;
}

/* -------------------------------------------------------------------------- */
/* VectorService                                                              */
/* -------------------------------------------------------------------------- */

export class VectorService {
  private memoryCollectionName = 'user_memory_base';

  /* -------------------------------------------------------------------------- */
  /* Collection helpers                                                         */
  /* -------------------------------------------------------------------------- */

  /**
   * 内部通用 Collection 获取方法
   */
  private async getCollection(name: string) {
    return await chromaClient.getOrCreateCollection({
      name: name,
      embeddingFunction: getEmbeddingFunction(),
    });
  }

  private buildMemoryWhereClause(
    userId: string,
    characterId: string,
    startTime?: number,
  ): Where {
    const filters: Where[] = [{ user_id: userId }, { character_id: characterId }];
    if (startTime !== undefined) {
      filters.push({ timestamp: { $gte: startTime } });
    }
    return { $and: filters };
  }

  /* -------------------------------------------------------------------------- */
  /* User memory                                                                */
  /* -------------------------------------------------------------------------- */

  /**
   * 存储定期提取的记忆
   */
  async addMemories(memories: AddMemoryInput[]): Promise<void> {
    if (memories.length === 0) return;

    const collection = await this.getCollection(this.memoryCollectionName);

    await collection.add({
      ids: memories.map((m) => m.id),
      documents: memories.map((m) => m.text),
      metadatas: memories.map((m) => ({
        user_id: m.userId,
        character_id: m.characterId,
        timestamp: m.timestamp,
        type: m.type,
        confidence: m.confidence,
        last_active_at: m.lastActiveAt,
      })),
    });
  }

  /**
   * 聊天 RAG 检索记忆：Chroma 语义召回 → 衰减重排 → MySQL 滤 isDeleted → 取 top limit。
   * MySQL 是「仍活跃」的权威源；双写非原子时 Chroma 可能仍返回已软删 id。
   */
  async queryMemoryWithDecay(
    queryText: string,
    limit = env.MEMORY_RAG_LIMIT,
    options: QueryMemoryWithDecayOptions,
  ): Promise<MemoryCandidate[]> {
    const nowMs = options.nowMs ?? Date.now();
    const candidateMultiplier = options.candidateMultiplier ?? env.MEMORY_RAG_CANDIDATE_MULTIPLIER;
    const collection = await this.getCollection(this.memoryCollectionName);

    const whereClause = this.buildMemoryWhereClause(
      options.userId,
      options.characterId,
      options.startTime,
    );

    const response = await collection.query({
      queryTexts: [queryText],
      // 多拉候选，后续用 confidence×衰减重排，避免仅按 embedding 距离取 top
      nResults: limit * candidateMultiplier,
      where: whereClause,
      // 必须显式 include，否则无 document 文本可进 prompt
      include: ['documents', 'metadatas', 'distances'],
    });

    const ids = (response.ids[0] as string[]) ?? [];
    const documents = (response.documents[0] as string[]) ?? [];
    const metadatas = (response.metadatas[0] as Record<string, unknown>[]) ?? [];
    const distances = (response.distances[0] as number[]) ?? [];

    const candidates: MemoryCandidate[] = ids.flatMap((id, index) => {
      const text = documents[index] ?? '';
      // Chroma 可能有 id 但 document 为空（双写 desync 或历史脏数据）
      if (!text) return [];

      const parsed = parseMemoryMetadata(metadatas[index], nowMs);
      return [
        {
          id,
          text,
          distance: distances[index] ?? 1,
          ...parsed,
        },
      ];
    });

    const ranked = candidates.toSorted((a, b) => {
      const scoreA = effectiveScore(a.distance, a.confidence, a.lastActiveAt, nowMs, a.type);
      const scoreB = effectiveScore(b.distance, b.confidence, b.lastActiveAt, nowMs, b.type);
      return scoreB - scoreA;
    });

    if (ranked.length === 0) return [];

    // 防御性过滤：软删与删向量非原子，以 MySQL isDeleted=false 为准剔除 ghost 命中
    const activeRows = await prisma.userMemory.findMany({
      where: {
        id: { in: ranked.map((item) => item.id) },
        userId: options.userId,
        characterId: options.characterId,
        isDeleted: false,
      },
      select: { id: true },
    });
    const activeIds = new Set(activeRows.map((row) => row.id));

    return ranked.filter((item) => activeIds.has(item.id)).slice(0, limit);
  }

  /** 按文本查询语义近邻记忆（用于维护阶段相似聚类）。 */
  async findMemoryNeighbors(
    queryText: string,
    limit = env.MEMORY_MAINTAIN_NEIGHBOR_LIMIT,
    options: FindMemoryNeighborsOptions,
  ): Promise<MemoryNeighbor[]> {
    const collection = await this.getCollection(this.memoryCollectionName);

    const response = await collection.query({
      queryTexts: [queryText],
      nResults: limit + (options.excludeId ? 1 : 0),
      where: {
        $and: [{ user_id: options.userId }, { character_id: options.characterId }],
      },
      include: ['distances'],
    });

    const ids = (response.ids[0] as string[]) ?? [];
    const distances = (response.distances[0] as number[]) ?? [];

    return ids
      .flatMap((id, index) => {
        if (id === options.excludeId) return [];
        return [{ id, distance: distances[index] ?? 1 }];
      })
      .slice(0, limit);
  }

  /** 从 Chroma 删除指定记忆向量。 */
  async deleteMemories(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const collection = await this.getCollection(this.memoryCollectionName);
    await collection.delete({ ids });
  }

  /** 删除该用户在 Chroma 中的全部记忆向量。 */
  async deleteMemoriesByUserId(userId: string): Promise<void> {
    const collection = await this.getCollection(this.memoryCollectionName);
    await collection.delete({
      where: { user_id: userId },
    });
  }

  /** 更新单条记忆的向量与 metadata。 */
  async updateMemory(input: UpdateMemoryInput): Promise<void> {
    const collection = await this.getCollection(this.memoryCollectionName);

    await collection.update({
      ids: [input.id],
      documents: [input.text],
      metadatas: [
        {
          user_id: input.userId,
          character_id: input.characterId,
          timestamp: input.timestamp,
          type: input.type,
          confidence: input.confidence,
          last_active_at: input.lastActiveAt,
        },
      ],
    });
  }

  /**
   * 检索记忆：支持引入时间范围过滤（可选）
   */
  async queryMemory(
    queryText: string,
    userId: string,
    characterId: string,
    limit = env.MEMORY_RAG_LIMIT,
    startTime?: number,
  ): Promise<string[]> {
    const hits = await this.queryMemoryWithDecay(queryText, limit, {
      userId,
      characterId,
      startTime,
    });
    return hits.map((hit) => hit.text);
  }

  /**
   * RAG 命中后回写 lastActiveAt，供 queryMemoryWithDecay 衰减公式使用。
   */
  async touchMemories(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const now = new Date();
    const nowMs = now.getTime();

    const rows = await prisma.userMemory.findMany({
      where: { id: { in: ids }, isDeleted: false },
      select: { id: true, userId: true, characterId: true },
    });

    if (rows.length === 0) return;

    await prisma.userMemory.updateMany({
      where: { id: { in: rows.map((row) => row.id) }, isDeleted: false },
      data: { lastActiveAt: now },
    });

    const collection = await this.getCollection(this.memoryCollectionName);
    await collection.update({
      ids: rows.map((row) => row.id),
      metadatas: rows.map((row) => ({
        user_id: row.userId,
        character_id: row.characterId,
        last_active_at: nowMs,
      })),
    });
  }
}
