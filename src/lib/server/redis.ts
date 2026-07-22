import { env } from '@/lib/server/env';
import { type ConnectionOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';

/**
 * BullMQ 声明依赖 ioredis@5.10.1，项目 override 到 5.11.1 后
 * 运行时一致，但类类型身份仍会冲突，故在传入 Queue/Worker 时断言。
 */
export function asBullMqConnection(redis: IORedis): ConnectionOptions {
  return redis as ConnectionOptions;
}

type RedisClient = IORedis;

function createRedisConnection(): RedisClient {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

declare const globalThis: {
  redisGlobal?: RedisClient;
  bullmqQueuesGlobal?: Map<string, Queue>;
} & typeof global;

let redisConnection: RedisClient | undefined;
const queueMap = new Map<string, Queue>();

/** 懒创建 Redis 连接（BullMQ 要求 maxRetriesPerRequest: null）。 */
export function getRedisConnection(): RedisClient {
  if (env.NODE_ENV !== 'production') {
    globalThis.redisGlobal ??= createRedisConnection();
    return globalThis.redisGlobal;
  }
  redisConnection ??= createRedisConnection();
  return redisConnection;
}

/** PING Redis；失败时抛错。 */
export async function pingRedis(): Promise<true> {
  const result = await getRedisConnection().ping();
  if (result !== 'PONG') {
    throw new Error(`Redis PING 失败：期望 PONG，收到 ${String(result)}`);
  }
  return true;
}

function getQueueMap(): Map<string, Queue> {
  if (env.NODE_ENV !== 'production') {
    globalThis.bullmqQueuesGlobal ??= new Map();
    return globalThis.bullmqQueuesGlobal;
  }
  return queueMap;
}

/** 按名称懒创建 BullMQ Queue（同名复用）。 */
export function getQueue(name: string): Queue {
  const queues = getQueueMap();
  const existing = queues.get(name);
  if (existing) return existing;

  const queue = new Queue(name, { connection: asBullMqConnection(getRedisConnection()) });
  queues.set(name, queue);
  return queue;
}
