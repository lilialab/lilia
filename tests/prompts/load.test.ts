import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHARACTER_ID,
  loadCharacter,
  loadJobPrompt,
  loadPlatformSafety,
} from '@/prompts/load';

describe('prompts/load', () => {
  it('默认角色为 arbor', () => {
    expect(DEFAULT_CHARACTER_ID).toBe('arbor');
    const character = loadCharacter();
    expect(character.id).toBe('arbor');
    expect(character.displayName).toBe('阿尔博');
    expect(character.persona).toContain('阿尔博');
    expect(character.skills).toEqual(['searchChatHistory']);
  });

  it('可加载占位角色 bob', () => {
    const character = loadCharacter('bob');
    expect(character.id).toBe('bob');
    expect(character.displayName).toBe('Bob');
    expect(character.persona).toContain('Bob');
    expect(character.skills).toEqual([]);
  });

  it('loadJobPrompt(extract) 含核心规则与弱模型约束', () => {
    const prompt = loadJobPrompt('extract');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('finished_memories');
    expect(prompt).toContain('弱模型额外约束');
    expect(prompt).toContain('阿尔博');
  });

  it('loadJobPrompt(maintain|profile) 与平台 safety 非空', () => {
    expect(loadJobPrompt('maintain')).toContain('记忆库维护专家');
    expect(loadJobPrompt('profile')).toContain('用户画像维护专家');
    expect(loadPlatformSafety().length).toBeGreaterThan(20);
  });

  it('loadJobPrompt 未知 id 抛错', () => {
    expect(() => loadJobPrompt('unknown' as never)).toThrow(/未知 job prompt/);
  });
});
