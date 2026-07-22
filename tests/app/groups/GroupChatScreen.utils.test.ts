import {
  buildUserOutboundMetadata,
  sendTurnCueIfMentioned,
} from '@/app/groups/components/GroupChatScreen.utils';
import { MESSAGE_KIND_TURN_CUE } from '@/types/message-kind';
import { describe, expect, it, vi } from 'vitest';

describe('buildUserOutboundMetadata', () => {
  it('无 @ 时 slug 为 null', () => {
    expect(buildUserOutboundMetadata('你好')).toEqual({ kind: null, slug: null });
    expect(buildUserOutboundMetadata('')).toEqual({ kind: null, slug: null });
  });

  it('提取第一个 @slug', () => {
    expect(buildUserOutboundMetadata('请 @arbor 帮忙')).toEqual({ kind: null, slug: 'arbor' });
    expect(buildUserOutboundMetadata('@bob 你好')).toEqual({ kind: null, slug: 'bob' });
  });

  it('多个 @ 只取第一处', () => {
    expect(buildUserOutboundMetadata('@arbor 再叫 @bob')).toEqual({ kind: null, slug: 'arbor' });
  });

  it('支持数字下划线和连字符', () => {
    expect(buildUserOutboundMetadata('hi @ai_bot-2')).toEqual({ kind: null, slug: 'ai_bot-2' });
  });

  it('中文等非法字符截断 slug', () => {
    expect(buildUserOutboundMetadata('@arbor你好')).toEqual({ kind: null, slug: 'arbor' });
    expect(buildUserOutboundMetadata('@阿尔博')).toEqual({ kind: null, slug: null });
  });
});

describe('sendTurnCueIfMentioned', () => {
  const members = [{ slug: 'arbor' }, { slug: 'bob' }];

  it('助手 @ 群成员时发送 turn_cue', () => {
    const sendMessage = vi.fn();
    sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '交给 @bob 吧' }],
      members,
      sendMessage,
    });

    expect(sendMessage).toHaveBeenCalledWith({
      text: '【系统】你（@bob）被点名，请基于上文以自己身份继续发言。',
      metadata: { kind: MESSAGE_KIND_TURN_CUE, slug: 'bob' },
    });
  });

  it('无 @ 或不在成员列表时不发送', () => {
    const sendMessage = vi.fn();
    sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '你好' }],
      members,
      sendMessage,
    });
    sendTurnCueIfMentioned({
      assistantParts: [{ type: 'text', text: '请 @carol 来' }],
      members,
      sendMessage,
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
