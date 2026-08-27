import {
  DEFAULT_CHARACTER_ID,
  loadCharacter,
  loadExtractPrompt,
  loadJobPrompt,
  readPromptFile,
} from '@/prompts/load';
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

  it('loadExtractPrompt(lilia) 含核心规则与弱模型约束', () => {
    const prompt = loadExtractPrompt('lilia');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('finished_memories');
    expect(prompt).toContain('弱模型额外约束');
    expect(prompt).toContain('莉莉娅');
  });

  it('loadExtractPrompt 未知角色 fallback 到全局默认', () => {
    const prompt = loadExtractPrompt('nonexistent');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('finished_memories');
    expect(prompt).not.toContain('专属提取重点');
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
});
