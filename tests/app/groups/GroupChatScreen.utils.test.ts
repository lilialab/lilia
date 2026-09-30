import {
  buildUserOutboundMessage,
  groupMentionStorageKey,
  MAX_TURN_CUE_HOPS,
  sendTurnCueIfMentioned,
  TURN_CUE_TEXT,
} from '@/app/groups/components/GroupChatScreen.utils';
import { MESSAGE_KIND_TURN_CUE } from '@/types/message-kind';
import { describe, expect, it, vi } from 'vitest';

describe('groupMentionStorageKey', () => {
  it('按群 id 区分', () => {
    expect(groupMentionStorageKey('g1')).toBe('lilia:group-mention:g1');
  });
});

describe('buildUserOutboundMessage', () => {
  const user = {
    id: 'u1',
    nickname: '阿明',
    hasAvatar: true,
    updatedAt: '2026-09-13T00:00:00.000Z',
  };

  it('正文前拼 @slug，metadata 直接带 slug', () => {
    expect(buildUserOutboundMessage('你好', 'einstein', user)).toEqual({
      text: '@einstein 你好',
      metadata: {
        kind: null,
        slug: 'einstein',
        name: '阿明',
        speakerId: 'u1',
        hasAvatar: true,
        avatarUpdatedAt: '2026-09-13T00:00:00.000Z',
      },
    });
    expect(buildUserOutboundMessage('  hi  ', 'lilia', user)).toEqual({
      text: '@lilia hi',
      metadata: {
        kind: null,
        slug: 'lilia',
        name: '阿明',
        speakerId: 'u1',
        hasAvatar: true,
        avatarUpdatedAt: '2026-09-13T00:00:00.000Z',
      },
    });
  });
});

describe('sendTurnCueIfMentioned', () => {
  const members = [{ slug: 'lilia' }, { slug: 'einstein' }];

  it('助手结尾一行 @ 群成员时发送 turn_cue', () => {
    const sendMessage = vi.fn();
    const result = sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '这事他比我清楚。\n@einstein' }],
      members,
      sendMessage,
      hopCount: 0,
    });

    expect(result).toBe('sent');
    expect(sendMessage).toHaveBeenCalledWith({
      text: TURN_CUE_TEXT,
      metadata: {
        kind: MESSAGE_KIND_TURN_CUE,
        slug: 'einstein',
        name: null,
        speakerId: null,
        hasAvatar: false,
        avatarUpdatedAt: '',
      },
    });
  });

  it('紧跟中文标点的结尾 handle 也算交棒', () => {
    const sendMessage = vi.fn();
    expect(
      sendTurnCueIfMentioned({
        assistantParts: [{ type: 'text', text: '你觉得呢？@einstein' }],
        members,
        sendMessage,
        hopCount: 0,
      }),
    ).toBe('sent');
    expect(sendMessage).toHaveBeenCalledOnce();
  });

  it('句中出现 @、结尾不是 handle 时不发送', () => {
    const sendMessage = vi.fn();
    expect(
      sendTurnCueIfMentioned({
        assistantParts: [{ type: 'text', text: '交给 @einstein 吧' }],
        members,
        sendMessage,
        hopCount: 0,
      }),
    ).toBe('noop');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('无 @ 或结尾 handle 不在成员列表时不发送（含人类昵称）', () => {
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
    expect(
      sendTurnCueIfMentioned({
        assistantParts: [{ type: 'text', text: '十六号。\n@小明' }],
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
      assistantParts: [{ type: 'text', text: '交给你了\n@einstein' }],
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
      assistantParts: [{ type: 'text', text: '交给你了\n@einstein' }],
      members,
      sendMessage,
      hopCount: MAX_TURN_CUE_HOPS - 1,
    });
    expect(result).toBe('sent');
    expect(sendMessage).toHaveBeenCalledOnce();
  });
});
