import { type streamText, type UIMessage } from 'ai';

/** 消息 kind：null/缺省为普通消息；非空为特殊通道。 */
export const MESSAGE_KIND_TURN_CUE = 'turn_cue' as const;

export type MessageKind = typeof MESSAGE_KIND_TURN_CUE;

/** 聊天 UIMessage.metadata（单聊 / 群聊统一）。 */
export type MessageMetadata = {
  kind: string | null;
  slug: string | null;
  /** 助手消息才有；用户出站可不带 */
  speakerDisplayName?: string | null;
  speakerCharacterId?: string | null;
};

/** streamText 结果 + 写入 UI 流 start 事件的 metadata。 */
export type UIMessageStreamPayload = {
  streamResult: ReturnType<typeof streamText>;
  metadata: MessageMetadata;
};

export type ChatUIMessage = UIMessage<MessageMetadata>;

export function isTurnCueKind(kind: string | null | undefined): boolean {
  return kind === MESSAGE_KIND_TURN_CUE;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 从 metadata 读取 kind。 */
export function getMessageKind(message: { metadata?: unknown }): string | null {
  if (!isPlainObject(message.metadata)) return null;
  const kind = message.metadata.kind;
  return typeof kind === 'string' ? kind : null;
}

/** 气泡列表要展示的普通消息（无特殊 kind）。 */
export function isDisplayMessage(message: { metadata?: unknown }): boolean {
  return getMessageKind(message) === null;
}
