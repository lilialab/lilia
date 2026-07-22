import type { ChatStatus, UIMessage } from 'ai';

type ChatMessageLike = Pick<UIMessage, 'id' | 'role' | 'parts'>;

export function messageHasVisibleContent(message: ChatMessageLike): boolean {
  if (!message.parts) return false;

  return message.parts.some((part) => {
    if (part.type !== 'text' && part.type !== 'reasoning') return false;
    return part.text.trim().length > 0;
  });
}

/** submitted/streaming 且最后一条尚无可见正文（空壳助手等）。 */
export function isAwaitingAssistantResponse(
  status: ChatStatus,
  messages: ChatMessageLike[],
): boolean {
  if (status !== 'submitted' && status !== 'streaming') {
    return false;
  }
  const lastMessage = messages.at(-1);
  return lastMessage != null && !messageHasVisibleContent(lastMessage);
}
