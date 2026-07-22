import { describe, expect, it } from 'vitest';
import { extractFirstMentionSlug } from '@/app/groups/components/GroupChatScreen.utils';

describe('extractFirstMentionSlug', () => {
  it('无 @ 时返回 null', () => {
    expect(extractFirstMentionSlug('你好')).toBeNull();
    expect(extractFirstMentionSlug('')).toBeNull();
  });

  it('提取第一个 @slug', () => {
    expect(extractFirstMentionSlug('请 @arbor 帮忙')).toBe('arbor');
    expect(extractFirstMentionSlug('@bob 你好')).toBe('bob');
  });

  it('多个 @ 只取第一处', () => {
    expect(extractFirstMentionSlug('@arbor 再叫 @bob')).toBe('arbor');
  });

  it('支持数字下划线和连字符', () => {
    expect(extractFirstMentionSlug('hi @ai_bot-2')).toBe('ai_bot-2');
  });

  it('中文等非法字符截断 slug', () => {
    expect(extractFirstMentionSlug('@arbor你好')).toBe('arbor');
    expect(extractFirstMentionSlug('@阿尔博')).toBeNull();
  });
});
