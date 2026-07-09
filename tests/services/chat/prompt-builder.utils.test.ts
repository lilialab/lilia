import { describe, expect, it } from 'vitest';
import { routeSkill } from '@/services/chat/prompt-builder.utils';

describe('routeSkill', () => {
  it('routes emotional content to chat_mode', () => {
    const result = routeSkill('今天好难过');

    expect(result.skill).toBe('chat_mode');
    expect(result.block.length).toBeGreaterThan(0);
  });

  it('routes planning content to goal_mode', () => {
    const result = routeSkill('帮我定个计划');

    expect(result.skill).toBe('goal_mode');
    expect(result.block.length).toBeGreaterThan(0);
  });

  it('routes neutral content to general', () => {
    const result = routeSkill('你好');

    expect(result.skill).toBe('general');
    expect(result.block.length).toBeGreaterThan(0);
  });
});
