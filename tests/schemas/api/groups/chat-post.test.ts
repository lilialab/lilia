import { groupChatPostBodySchema } from '@/schemas/api/groups/chat-post';
import { describe, expect, it } from 'vitest';

function userMessage(overrides: {
  text?: string;
  kind?: 'turn_cue' | null;
  slug?: string | null;
  role?: 'system' | 'user' | 'assistant';
  id?: string;
}) {
  const { text = '大家好', kind, slug, role = 'user', id = 'm1' } = overrides;
  const metadata = kind === undefined && slug === undefined
    ? undefined
    : {
      kind,
      slug,
    };

  return {
    messages: [
      {
        id,
        role,
        parts: [{ type: 'text' as const, text }],
        metadata,
      },
    ],
  };
}

describe('groupChatPostBodySchema', () => {
  it('messages 必填且至少一条', () => {
    expect(groupChatPostBodySchema.safeParse({}).success).toBe(false);
    expect(groupChatPostBodySchema.safeParse({ messages: [] }).success).toBe(false);
  });

  it('允许历史助手消息含非 text part（如 reasoning）', () => {
    const result = groupChatPostBodySchema.safeParse({
      messages: [
        {
          id: 'a1',
          role: 'assistant',
          parts: [
            { type: 'reasoning', text: '...' },
            { type: 'text', text: '你好' },
          ],
        },
        {
          id: 'u1',
          role: 'user',
          parts: [{ type: 'text', text: '@bob 继续' }],
          metadata: { kind: null, slug: 'bob' },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('合法 body 通过校验', () => {
    const result = groupChatPostBodySchema.safeParse(userMessage({ text: '大家好' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages[0].parts[0].text).toBe('大家好');
      expect(result.data.messages[0].metadata).toBeUndefined();
    }
  });

  it('接受 metadata.kind: turn_cue', () => {
    const result = groupChatPostBodySchema.safeParse(
      userMessage({
        text: '【系统】你（@bob）被点名',
        kind: 'turn_cue',
        slug: 'bob',
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages[0].metadata?.kind).toBe('turn_cue');
      expect(result.data.messages[0].metadata?.slug).toBe('bob');
    }
  });

  it('slug 会 trim', () => {
    const result = groupChatPostBodySchema.safeParse(userMessage({ text: 'hi', slug: '  bob  ' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages[0].metadata?.slug).toBe('bob');
    }
  });

  it('拒绝空 slug', () => {
    expect(groupChatPostBodySchema.safeParse(userMessage({ text: 'hi', slug: '  ' })).success).toBe(
      false,
    );
  });

  it('接受 kind/slug: null', () => {
    const result = groupChatPostBodySchema.safeParse(
      userMessage({ text: 'hi', kind: null, slug: null }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages[0].metadata?.kind).toBeNull();
      expect(result.data.messages[0].metadata?.slug).toBeNull();
    }
  });

  it('拒绝未知 kind', () => {
    expect(
      groupChatPostBodySchema.safeParse({
        messages: [
          {
            id: 'm1',
            role: 'user',
            parts: [{ type: 'text', text: 'hi' }],
            metadata: { kind: 'other' },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('允许带展示字段的 metadata', () => {
    const result = groupChatPostBodySchema.safeParse({
      messages: [
        {
          id: 'm1',
          role: 'user',
          parts: [{ type: 'text', text: 'hi' }],
          metadata: {
            kind: null,
            slug: 'arbor',
            speakerDisplayName: null,
            speakerCharacterId: null,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
