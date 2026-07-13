import { describe, expect, it } from 'vitest';
import { chatPostBodySchema } from '@/schemas/api/chat/post';
import { DEFAULT_CLIENT_TIME_ZONE } from '@/utils/timezone';

describe('chatPostBodySchema', () => {
  it('缺省 sessionId 或 messages 解析失败', () => {
    expect(chatPostBodySchema.safeParse({ messages: [] }).success).toBe(false);
    expect(chatPostBodySchema.safeParse({ sessionId: 's1' }).success).toBe(false);
  });

  it('空 messages 解析失败', () => {
    expect(
      chatPostBodySchema.safeParse({ sessionId: 's1', messages: [] }).success,
    ).toBe(false);
  });

  it('合法 body 通过校验', () => {
    const result = chatPostBodySchema.safeParse({
      sessionId: '  s1  ',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'hello', state: 'done' }],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe('s1');
      expect(result.data.messages).toHaveLength(1);
      expect(result.data.messages[0].parts[0].text).toBe('hello');
      expect(result.data.clientTimeZone).toBe(DEFAULT_CLIENT_TIME_ZONE);
    }
  });

  it('合法 clientTimeZone 原样保留', () => {
    const result = chatPostBodySchema.safeParse({
      sessionId: 's1',
      clientTimeZone: 'America/New_York',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'hello' }],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientTimeZone).toBe('America/New_York');
    }
  });

  it('非法 clientTimeZone 回退为 Asia/Shanghai', () => {
    const result = chatPostBodySchema.safeParse({
      sessionId: 's1',
      clientTimeZone: 'Not/Valid',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'hello' }],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clientTimeZone).toBe(DEFAULT_CLIENT_TIME_ZONE);
    }
  });
});
