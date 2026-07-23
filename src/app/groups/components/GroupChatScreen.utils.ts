import { MESSAGE_KIND_TURN_CUE, type MessageMetadata } from '@/types/message-kind';
import { extractTextFromParts } from '@/utils/message-parts';

/** 一次用户发言后，自动 turn_cue 续聊最多轮次。 */
export const MAX_TURN_CUE_HOPS = 5;

/**
 * 从文本中提取第一个 @slug（精确匹配用）。
 * 规则：/@([a-zA-Z0-9_-]+)/ 取第一处。
 */
function extractFirstMentionSlug(text: string): string | null {
  const match = /@([a-zA-Z0-9_-]+)/.exec(text);
  return match?.[1] ?? null;
}

/** 群聊续聊触发语文案（turn_cue 正文）。 */
function buildTurnCueText(characterSlug: string): string {
  return `【系统】你（@${characterSlug}）被点名，请基于上文以自己身份继续发言。`;
}

export type TurnCueSendMessage = (message: {
  text: string;
  metadata: MessageMetadata;
}) => unknown;

/** 用户主动发送时的 metadata（普通消息 + 可选 @slug）。 */
export function buildUserOutboundMetadata(text: string): MessageMetadata {
  return {
    kind: null,
    slug: extractFirstMentionSlug(text),
  };
}

/** 将 `@slug` 追加到输入末尾（尾随空格；末尾已有空白则不重复前导空格）。 */
export function appendMentionSlug(text: string, slug: string): string {
  const needsSpace = text.length > 0 && !/\s$/.test(text);
  return `${text}${needsSpace ? ' ' : ''}@${slug} `;
}

export type SendTurnCueResult = 'sent' | 'noop' | 'capped';

/**
 * 助手一轮结束后：若正文 @ 了群内成员，则发送 turn_cue 触发其续聊。
 * 无有效 @、或不在成员列表时 noop；已达 hop 上限时 capped（不发送）。
 */
export function sendTurnCueIfMentioned(options: {
  assistantParts: unknown;
  members: readonly { slug: string }[];
  sendMessage: TurnCueSendMessage;
  /** 本轮用户发言后已发出的 turn_cue 次数 */
  hopCount: number;
  maxHops?: number;
}): SendTurnCueResult {
  const {
    assistantParts,
    members,
    sendMessage,
    hopCount,
    maxHops = MAX_TURN_CUE_HOPS,
  } = options;
  const slug = extractFirstMentionSlug(extractTextFromParts(assistantParts));
  if (!slug || !members.some((m) => m.slug === slug)) return 'noop';

  if (hopCount >= maxHops) return 'capped';

  void sendMessage({
    text: buildTurnCueText(slug),
    metadata: { kind: MESSAGE_KIND_TURN_CUE, slug },
  });
  return 'sent';
}
