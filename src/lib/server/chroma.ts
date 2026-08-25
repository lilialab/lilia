import { CompatibleEmbeddingFunction } from '@/lib/server/embeddings';
import { env } from '@/lib/server/env';
import { ChromaClient } from 'chromadb';

let sharedEmbed: CompatibleEmbeddingFunction | undefined;

/** Chroma 用的共享 EmbeddingFunction（OpenAI 兼容远程模型）。 */
export function getEmbeddingFunction(): CompatibleEmbeddingFunction {
  sharedEmbed ??= new CompatibleEmbeddingFunction({ model: env.EMBED_MODEL });
  return sharedEmbed;
}

const chromaClientSingleton = () => {
  return new ChromaClient({
    host: env.CHROMA_HOST,
    port: env.CHROMA_PORT,
  });
};

declare const globalThis: {
  chromaGlobal?: ReturnType<typeof chromaClientSingleton>;
} & typeof global;

export const chromaClient = globalThis.chromaGlobal ?? chromaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.chromaGlobal = chromaClient;
}
