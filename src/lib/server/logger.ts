import { env } from '@/lib/server/env';
import pino, { type TransportTargetOptions } from 'pino';

function buildLogger(): pino.Logger {
  const targets: TransportTargetOptions[] = [
    {
      target: 'pino/file',
      options: { destination: 1 },
      level: env.LOG_LEVEL,
    },
  ];

  if (env.LOG_TO_LOKI) {
    targets.push({
      target: 'pino-loki',
      options: {
        host: env.LOKI_URL,
        labels: { app: 'lilia' },
        propsToLabels: ['event'],
        batching: { interval: 5 },
      },
      level: env.LOG_LEVEL,
    });
  }

  return pino(
    { level: env.LOG_LEVEL, base: { app: 'lilia' } },
    pino.transport({ targets }),
  );
}

export const logger = buildLogger();

export type LlmLogEvent =
  | 'llm.chat.request'
  | 'llm.chat.response'
  | 'llm.extract.request'
  | 'llm.extract.response'
  | 'llm.extract.complete'
  | 'llm.extract.failed'
  | 'llm.extract.mark'
  | 'llm.extract.character.failed';

export function logLlmEvent(event: LlmLogEvent, fields: Record<string, unknown>): void {
  logger.info({ event, ...fields });
}
