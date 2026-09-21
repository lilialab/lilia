import type { ChatStatus, UIMessage } from 'ai';

type ChatMessageLike = Pick<UIMessage, 'id' | 'role' | 'parts'>;

/** 是否有展示给用户的内容。reasoning 故意不展示（见 MessagePartRenderer），因此不计入。 */
export function messageHasVisibleContent(message: ChatMessageLike): boolean {
  if (!message.parts) return false;

  return message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0);
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
  return lastMessage !== undefined && !messageHasVisibleContent(lastMessage);
}
