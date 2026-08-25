import { env } from '@/lib/server/env';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { embedMany } from 'ai';
import type { EmbeddingFunction } from 'chromadb';

const embedProvider = createOpenAICompatible({
  name: 'openai-compatible-embed',
  baseURL: env.EMBED_BASE_URL,
  apiKey: env.EMBED_API_KEY,
});

export interface CompatibleEmbeddingConfig {
  model: string;
}

/** Chroma EmbeddingFunction：OpenAI 兼容 /v1/embeddings */
export class CompatibleEmbeddingFunction implements EmbeddingFunction {
  public readonly name = 'openai-compatible-embedding-function';
  private readonly modelName: string;

  constructor(args: { model: string }) {
    this.modelName = args.model;
  }

  async generate(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const { embeddings } = await embedMany({
      model: embedProvider.embeddingModel(this.modelName),
      values: texts,
    });
    return embeddings as number[][];
  }

  getConfig(): CompatibleEmbeddingConfig {
    return { model: this.modelName };
  }

  validateConfigUpdate(config: Record<string, unknown>) {
    if ('model' in config) {
      throw new Error('Model cannot be updated');
    }
  }

  static buildFromConfig(config: CompatibleEmbeddingConfig): CompatibleEmbeddingFunction {
    return new CompatibleEmbeddingFunction(config);
  }
}
