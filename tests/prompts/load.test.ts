import { readJobPrompt, readPromptFile } from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('prompts/load', () => {
  it('共享 prompt 文件可读', () => {
    expect(readPromptFile('reply-rules.md').length).toBeGreaterThan(0);
    expect(readPromptFile('group-chat-rules.md').length).toBeGreaterThan(0);
    expect(readPromptFile('group-chat-examples.zh.md').length).toBeGreaterThan(0);
    expect(readPromptFile('group-chat-examples.en.md').length).toBeGreaterThan(0);
    expect(readPromptFile('jobs', 'extract.md').length).toBeGreaterThan(0);
    expect(readJobPrompt('maintain').length).toBeGreaterThan(0);
    expect(readJobPrompt('user-profile').length).toBeGreaterThan(0);
  });

  it('群聊 prompt 只用 prompt.service 提供的插值变量', () => {
    const placeholdersOf = (file: string) => readPromptFile(file).match(/\{\{\w+\}\}/g) ?? [];

    expect(new Set(placeholdersOf('group-chat-rules.md'))).toEqual(
      new Set(['{{name}}', '{{slug}}', '{{human}}']),
    );
    for (const file of ['group-chat-examples.zh.md', 'group-chat-examples.en.md']) {
      expect(new Set(placeholdersOf(file))).toEqual(
        new Set(['{{slug}}', '{{human}}', '{{other}}', '{{otherName}}']),
      );
    }
  });

  it('readJobPrompt 未知 id 抛错', () => {
    expect(() => readJobPrompt('unknown' as never)).toThrow(/未知 job prompt/);
  });
});
