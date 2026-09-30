import type { MessageMetadata } from '@/types/message-kind';
import { extractTextFromParts } from '@/utils/message-parts';
import type { UIMessage } from 'ai';

const LEADING_SPEAKER_LABELS = /^(?:\([a-zA-Z0-9_-]+\):\s*)+/;

/** 去掉正文开头已有的 (slug): 标签（防与上下文前缀叠写）。 */
export function stripLeadingSpeakerLabels(text: string): string {
  return text.replace(LEADING_SPEAKER_LABELS, '').trimStart();
}

function speakerSlugFromMessage(message: UIMessage): string {
  const metadata = message.metadata as MessageMetadata | undefined;
  const slug = metadata?.slug;
  return typeof slug === 'string' && slug.length > 0 ? slug : 'assistant';
}

/**
 * 给助手消息加 (slug): 前缀，仅供 convertToModelMessages / streamText 使用。
 * 入参应为未加前缀的干净上下文。
 */
export function withGroupSpeakerLabelsForModel(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => {
    if (message.role !== 'assistant') return message;

    const text = stripLeadingSpeakerLabels(extractTextFromParts(message.parts));
    const slug = speakerSlugFromMessage(message);
    return {
      ...message,
      parts: [{ type: 'text' as const, text: `(${slug}): ${text}` }],
    };
  });
}

/** 取上下文最后一条正文作 RAG 查询句（无说话人前缀）。 */
export function extractLatestContextTextForRag(messages: UIMessage[]): string {
  const last = messages.at(-1);
  return last ? extractTextFromParts(last.parts) : '';
}

/**
 * 本轮（用户最近一条消息之后）已发过言的成员 slug，按发言顺序去重。
 * 供花名册标注「已发言」，让模型换人而不是在两人之间来回撞。
 */
export function collectSpokenSlugsSinceLastUser(messages: UIMessage[]): string[] {
  let lastUserIndex = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') {
      lastUserIndex = i;
      break;
    }
  }

  const spoken: string[] = [];
  for (const message of messages.slice(lastUserIndex + 1)) {
    if (message.role !== 'assistant') continue;
    const slug = (message.metadata as MessageMetadata | undefined)?.slug;
    if (typeof slug === 'string' && slug.length > 0 && !spoken.includes(slug)) {
      spoken.push(slug);
    }
  }
  return spoken;
}
