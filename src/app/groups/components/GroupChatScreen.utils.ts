import {
  EMPTY_SPEAKER_AVATAR,
  MESSAGE_KIND_TURN_CUE,
  type MessageMetadata,
} from '@/types/message-kind';
import { extractTextFromParts } from '@/utils/message-parts';

/** 一次用户发言后，自动 turn_cue 续聊最多轮次。 */
export const MAX_TURN_CUE_HOPS = 5;

const GROUP_MENTION_STORAGE_PREFIX = 'lilia:group-mention:';

/**
 * turn_cue 触发语：本轮是谁、该谁说话都由 system prompt 交代，这里只留一个系统标记。
 * 不随界面语言变化，避免「每跳注入的文案」把模型带进某种语气或语言。
 */
export const TURN_CUE_TEXT = '[system] Your turn. Carry on as yourself.';

/**
 * 取正文结尾的 @handle（交棒行）。
 * 规则：\s*@(\S+)\s*$ —— 只认结尾，句中出现的不算；紧跟中文标点（`…呢？@rin`）也算。
 * 仅用于助手正文 → turn_cue；用户出站不解析正文（`metadata.slug` 来自单选）。
 */
function extractTrailingMentionSlug(text: string): string | null {
  const match = /\s*@([^\s@]+)\s*$/.exec(text);
  return match?.[1] ?? null;
}

export type TurnCueSendMessage = (message: {
  text: string;
  metadata: MessageMetadata;
}) => unknown;

export function groupMentionStorageKey(groupSessionId: string): string {
  return `${GROUP_MENTION_STORAGE_PREFIX}${groupSessionId}`;
}

/** 读取该群上次选中的 @ slug（无则 null）。 */
export function readStoredMentionSlug(groupSessionId: string): string | null {
  try {
    const value = localStorage.getItem(groupMentionStorageKey(groupSessionId));
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/** 写入该群选中的 @ slug。 */
export function writeStoredMentionSlug(groupSessionId: string, slug: string): void {
  try {
    localStorage.setItem(groupMentionStorageKey(groupSessionId), slug);
  } catch {
    // 隐私模式等写失败时忽略
  }
}

/** 用户主动发送：正文前拼 `@slug `，metadata.slug 由单选传入。 */
export function buildUserOutboundMessage(
  text: string,
  slug: string,
  user: { id: string; nickname: string; hasAvatar: boolean; updatedAt: string },
): { text: string; metadata: MessageMetadata } {
  return {
    text: `@${slug} ${text.trim()}`,
    metadata: {
      kind: null,
      slug,
      name: user.nickname,
      speakerId: user.id,
      hasAvatar: user.hasAvatar,
      avatarUpdatedAt: user.updatedAt,
    },
  };
}

export type SendTurnCueResult = 'sent' | 'noop' | 'capped';

/**
 * 助手一轮结束后：若正文**结尾**@ 了群内成员，则发送 turn_cue 触发其续聊。
 * 结尾 handle 不在成员列表（含人类昵称、未知 slug）时 noop；已达 hop 上限时 capped。
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
  const slug = extractTrailingMentionSlug(extractTextFromParts(assistantParts));
  if (!slug || !members.some((m) => m.slug === slug)) return 'noop';

  if (hopCount >= maxHops) return 'capped';

  void sendMessage({
    text: TURN_CUE_TEXT,
    metadata: { kind: MESSAGE_KIND_TURN_CUE, slug, name: null, ...EMPTY_SPEAKER_AVATAR },
  });
  return 'sent';
}
