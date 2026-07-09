import { describe, expect, it } from 'vitest';
import { chatPostBodySchema } from '@/schemas/api/chat/post';

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
    }
  });
});
