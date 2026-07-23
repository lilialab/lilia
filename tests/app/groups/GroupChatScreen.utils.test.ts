import {
  buildUserOutboundMessage,
  groupMentionStorageKey,
  MAX_TURN_CUE_HOPS,
  sendTurnCueIfMentioned,
} from '@/app/groups/components/GroupChatScreen.utils';
import { MESSAGE_KIND_TURN_CUE } from '@/types/message-kind';
import { describe, expect, it, vi } from 'vitest';

describe('groupMentionStorageKey', () => {
  it('按群 id 区分', () => {
    expect(groupMentionStorageKey('g1')).toBe('pai-arbor:group-mention:g1');
  });
});

describe('buildUserOutboundMessage', () => {
  it('正文前拼 @slug，metadata 直接带 slug', () => {
    expect(buildUserOutboundMessage('你好', 'bob')).toEqual({
      text: '@bob 你好',
      metadata: { kind: null, slug: 'bob' },
    });
    expect(buildUserOutboundMessage('  hi  ', 'arbor')).toEqual({
      text: '@arbor hi',
      metadata: { kind: null, slug: 'arbor' },
    });
  });
});

describe('sendTurnCueIfMentioned', () => {
  const members = [{ slug: 'arbor' }, { slug: 'bob' }];

  it('助手 @ 群成员时发送 turn_cue', () => {
    const sendMessage = vi.fn();
    const result = sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '交给 @bob 吧' }],
      members,
      sendMessage,
      hopCount: 0,
    });

    expect(result).toBe('sent');
    expect(sendMessage).toHaveBeenCalledWith({
      text: '【系统】你（@bob）被点名，请基于上文以自己身份继续发言。',
      metadata: { kind: MESSAGE_KIND_TURN_CUE, slug: 'bob' },
    });
  });

  it('无 @ 或不在成员列表时不发送', () => {
    const sendMessage = vi.fn();
    expect(
      sendTurnCueIfMentioned({
        assistantParts: [{ type: 'text', text: '你好' }],
        members,
        sendMessage,
        hopCount: 0,
      }),
    ).toBe('noop');
    expect(
      sendTurnCueIfMentioned({
        assistantParts: [{ type: 'text', text: '请 @carol 来' }],
        members,
        sendMessage,
        hopCount: 0,
      }),
    ).toBe('noop');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it(`hopCount 达 ${MAX_TURN_CUE_HOPS} 时 capped 且不发送`, () => {
    const sendMessage = vi.fn();
    const result = sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '交给 @bob 吧' }],
      members,
      sendMessage,
      hopCount: MAX_TURN_CUE_HOPS,
    });
    expect(result).toBe('capped');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('hopCount 未达上限时可继续发送', () => {
    const sendMessage = vi.fn();
    const result = sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '交给 @bob 吧' }],
      members,
      sendMessage,
      hopCount: MAX_TURN_CUE_HOPS - 1,
    });
    expect(result).toBe('sent');
    expect(sendMessage).toHaveBeenCalledOnce();
  });
});
