import { logger } from '@/lib/server/logger';
import { prisma } from '@/lib/server/prisma';
import type { MemoryFragment } from '@/services/chat/prompt-format.utils';
import { VectorService } from '@/services/memory/vector.service';

const vectorService = new VectorService();

/**
 * 按用户输入从向量记忆库检索相关历史片段（含衰减重排与命中回写）。
 * 仅召回该 userId + characterId 下的私有记忆。
 */
export async function fetchMemoryFragmentsForPrompt(
  content: string,
  userId: string,
  characterId: string,
): Promise<MemoryFragment[]> {
  if (!content) return [];
  try {
    const hits = await vectorService.queryMemoryWithDecay(content, undefined, {
      userId,
      characterId,
    });
    const ids = hits.map((hit) => hit.id);
    if (ids.length === 0) return [];

    void vectorService.touchMemories(ids).catch((err) => {
      logger.warn({ err }, '[Chroma] 记忆 lastActiveAt 回写失败');
    });

    const rows = await prisma.userMemory.findMany({
      where: { id: { in: ids }, userId, characterId },
      select: { id: true, type: true, createdAt: true, lastActiveAt: true },
    });
    const rowById = new Map(rows.map((row) => [row.id, row]));

    const fragments: MemoryFragment[] = [];
    for (const hit of hits) {
      const row = rowById.get(hit.id);
      if (!row) {
        logger.warn({ memoryId: hit.id }, '[RAG] Chroma 命中但 MySQL 无对应记忆，已跳过');
        continue;
      }
      fragments.push({
        text: hit.text,
        type: row.type as MemoryFragment['type'],
        recordedAt: row.createdAt,
        lastActiveAt: row.lastActiveAt,
      });
    }
    return fragments;
  } catch (err) {
    logger.error({ err }, '[Chroma] 知识库检索失败');
    return [];
  }
}
