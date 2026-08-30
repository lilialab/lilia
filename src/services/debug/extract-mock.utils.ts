import { formatExtractMessageXml } from '@/services/memory/extract.utils';

export interface ExtractMockMessage {
  speaker: string;
  text: string;
}

/**
 * 将 mock 消息编成 transcript。`speaker: assistant` 会换成所选角色 slug。
 * 空正文跳过；id 为 m0、m1…
 */
export function buildMockExtractTranscript(
  messages: ExtractMockMessage[],
  assistantSlug: string,
): { transcript: string; messageIds: string[] } {
  const messageIds: string[] = [];
  const lines: string[] = [];
  let seq = 0;
  for (const message of messages) {
    const speaker = message.speaker === 'assistant' ? assistantSlug : message.speaker;
    const id = `m${seq}`;
    const line = formatExtractMessageXml(id, seq, speaker, message.text);
    if (line === null) continue;
    messageIds.push(id);
    lines.push(line);
    seq += 1;
  }
  return { transcript: lines.join('\n'), messageIds };
}
