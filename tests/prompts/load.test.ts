import { DEFAULT_CHARACTER_ID, loadCharacter, loadJobPrompt, readPromptFile } from '@/prompts/load';
import { describe, expect, it } from 'vitest';

describe('prompts/load', () => {
  it('默认角色为 lilia', () => {
    expect(DEFAULT_CHARACTER_ID).toBe('lilia');
    const character = loadCharacter(DEFAULT_CHARACTER_ID);
    expect(character.id).toBe('lilia');
    expect(character.persona).toContain('{{name}}');
    expect(character.persona).not.toContain('莉莉娅');
    expect(character.skills).toEqual(['searchChatHistory']);
    expect(character.profile).toBe(
      'name: {{name}}\nage: 15\ngender: female\nheight: 147cm\nhobbies: reading',
    );
  });

  it('可加载占位角色 einstein / socrates', () => {
    const einstein = loadCharacter('einstein');
    expect(einstein.id).toBe('einstein');
    expect(einstein.persona).toContain('{{name}}');
    expect(einstein.persona).not.toContain('爱因斯坦');
    expect(einstein.skills).toEqual([]);
    expect(einstein.profile).toBe('name: {{name}}\ngender: male');

    const socrates = loadCharacter('socrates');
    expect(socrates.id).toBe('socrates');
    expect(socrates.persona).toContain('{{name}}');
    expect(socrates.persona).not.toContain('苏格拉底');
    expect(socrates.skills).toEqual([]);
    expect(socrates.profile).toBe('name: {{name}}\ngender: male');
  });

  it('每个角色都有 extract.md', () => {
    const extractCore = readPromptFile('jobs', 'extract-core.md');
    expect(extractCore).toContain('finished_memories');
    expect(extractCore).not.toContain('<extract_rules>');
    for (const slug of ['lilia', 'einstein', 'socrates'] as const) {
      expect(readPromptFile('characters', slug, 'extract.md').length).toBeGreaterThan(0);
    }
  });

  it('loadJobPrompt(maintain|profile) 非空', () => {
    expect(loadJobPrompt('maintain')).toContain('记忆库维护专家');
    expect(loadJobPrompt('profile')).toContain('用户画像维护专家');
    expect(loadJobPrompt('profile')).toContain('nickname:');
  });

  it('loadJobPrompt 未知 id 抛错', () => {
    expect(() => loadJobPrompt('unknown' as never)).toThrow(/未知 job prompt/);
  });

  it('loadCharacter 未知 slug 抛错', () => {
    expect(() => loadCharacter('nonexistent')).toThrow(/未知角色 prompt/);
  });

  it('reply-rules.md 含产品约束，不含厂商已覆盖的危机条款', () => {
    const replyRules = readPromptFile('reply-rules.md');
    expect(replyRules).toContain('不得向用户泄露');
    expect(replyRules).toContain('不得编造');
    expect(replyRules).not.toContain('自伤');
    expect(replyRules).not.toContain('<reply_rules>');
  });

  it('group-chat-rules.md 含 slug 占位符，不含外层标签', () => {
    const rules = readPromptFile('group-chat-rules.md');
    expect(rules).toContain('{{slug}}');
    expect(rules).toContain('@{{slug}}');
    expect(rules).not.toContain('<group_chat_rules>');
  });
});
