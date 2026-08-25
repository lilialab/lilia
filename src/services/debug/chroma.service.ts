// app/api/debug-chroma/service.ts
import { chromaClient, getEmbeddingFunction } from '@/lib/server/chroma';
import { randomUUID } from 'crypto';

/** 列出 Chroma 中全部 collection 及其元信息。 */
export async function listAllCollections() {
  const collections = await chromaClient.listCollections();
  return {
    count: collections.length,
    collections: collections.map((c) => ({
      name: c.name,
      metadata: c.metadata,
      id: c.id,
    })),
  };
}

/** 查看指定 collection 的文档数量与抽样预览。 */
export async function getCollectionInfo(collectionName: string, limit: number) {
  const collection = await chromaClient.getCollection({
    name: collectionName,
    embeddingFunction: getEmbeddingFunction(),
  });
  const count = await collection.count();
  const preview = await collection.get({
    limit,
    include: ['documents', 'metadatas'],
  });

  return {
    collection: {
      name: collection.name,
      metadata: collection.metadata,
      count,
      preview,
    },
  };
}

/** 向指定 collection 批量插入调试用的测试文档。 */
export async function insertTestData(collectionName: string, dataArray: string[]) {
  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: getEmbeddingFunction(),
  });

  const entries = dataArray.map((item) => ({
    id: randomUUID(),
    document: item,
    metadata: { source: 'debug' },
  }));

  await collection.add({
    ids: entries.map((entry) => entry.id),
    documents: entries.map((entry) => entry.document),
    metadatas: entries.map((entry) => entry.metadata),
  });

  const ids = entries.map((entry) => entry.id);

  return {
    message: `成功向集合 ${collectionName} 插入了 ${ids.length} 条数据。`,
    insertedIds: ids,
  };
}

/** 彻底删除指定 collection。 */
export async function deleteCollection(collectionName: string) {
  await chromaClient.deleteCollection({ name: collectionName });
  return { message: `集合 ${collectionName} 已彻底删除` };
}

/** 删除并重建指定 collection（清空全部向量数据）。 */
export async function resetCollection(collectionName: string) {
  await chromaClient.deleteCollection({ name: collectionName });
  await chromaClient.createCollection({
    name: collectionName,
    embeddingFunction: getEmbeddingFunction(),
  });
  return { message: `集合 ${collectionName} 已清空` };
}
