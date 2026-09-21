import {
  isAwaitingAssistantResponse,
  messageHasVisibleContent,
} from '@/app/chat/utils/message-content';
import type { UIMessage } from 'ai';
import { describe, expect, it } from 'vitest';

type MessageLike = Pick<UIMessage, 'id' | 'role' | 'parts'>;

function assistantMessage(parts: MessageLike['parts']): MessageLike {
  return { id: 'm1', role: 'assistant', parts };
}

describe('messageHasVisibleContent', () => {
  it('只有 reasoning 不算可见内容', () => {
    expect(messageHasVisibleContent(assistantMessage([{ type: 'reasoning', text: '想想' }]))).toBe(
      false,
    );
  });

  it('思考过程之后到达正文才算', () => {
    const parts: MessageLike['parts'] = [
      { type: 'reasoning', text: '想想' },
      { type: 'text', text: '在的' },
    ];
    expect(messageHasVisibleContent(assistantMessage(parts))).toBe(true);
  });

  it('空白正文不算', () => {
    expect(messageHasVisibleContent(assistantMessage([{ type: 'text', text: '  ' }]))).toBe(false);
  });
});

describe('isAwaitingAssistantResponse', () => {
  it('streaming 且只有思考过程：显示 loading', () => {
    const messages = [assistantMessage([{ type: 'reasoning', text: '想想' }])];
    expect(isAwaitingAssistantResponse('streaming', messages)).toBe(true);
  });

  it('streaming 且正文已到达：不显示 loading', () => {
    const messages = [assistantMessage([{ type: 'text', text: '在的' }])];
    expect(isAwaitingAssistantResponse('streaming', messages)).toBe(false);
  });

  it('非 streaming 状态：不显示 loading', () => {
    const messages = [assistantMessage([{ type: 'reasoning', text: '想想' }])];
    expect(isAwaitingAssistantResponse('ready', messages)).toBe(false);
  });
});
