import { formatExtractMessageXml } from '@/services/memory/extract.utils';
import { formatLocalDateTime } from '@/utils/timezone';

export interface ExtractMockMessage {
  speaker: string;
  text: string;
}

/** Debug 夹具消息时钟起点（UTC）；按夹具 timeZone 格式化为 local_time，每条间隔 1 分钟。 */
export const EXTRACT_MOCK_CLOCK_START_MS = Date.parse('2026-08-31T12:00:00.000Z');
const EXTRACT_MOCK_STEP_MS = 60_000;

/**
 * 将 mock 消息编成 transcript。`speaker: assistant` 会换成所选角色 slug。
 * 空正文跳过；id 为 m0、m1…；local_time 由起点 + seq 分钟得出。
 */
export function buildMockExtractTranscript(
  messages: ExtractMockMessage[],
  assistantSlug: string,
  timeZone: string,
): { transcript: string; messageIds: string[] } {
  const messageIds: string[] = [];
  const lines: string[] = [];
  let seq = 0;
  for (const message of messages) {
    const speaker = message.speaker === 'assistant' ? assistantSlug : message.speaker;
    const id = `m${seq}`;
    const localTime = formatLocalDateTime(
      new Date(EXTRACT_MOCK_CLOCK_START_MS + seq * EXTRACT_MOCK_STEP_MS),
      timeZone,
    );
    const line = formatExtractMessageXml(id, seq, speaker, message.text, localTime);
    if (line === null) continue;
    messageIds.push(id);
    lines.push(line);
    seq += 1;
  }
  return { transcript: lines.join('\n'), messageIds };
}
