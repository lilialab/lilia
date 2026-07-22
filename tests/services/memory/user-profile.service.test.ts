import {
  buildProfileRefreshPrompt,
  formatProfileForPrompt,
} from '@/services/memory/user-profile.service';
import { describe, expect, it } from 'vitest';

describe('formatProfileForPrompt', () => {
  it('returns placeholder when summary and facets are empty', () => {
    expect(formatProfileForPrompt(null, null)).toBe('目前暂无特殊偏好记录。');
    expect(formatProfileForPrompt('  ', {})).toBe('目前暂无特殊偏好记录。');
  });

  it('formats summary only', () => {
    expect(formatProfileForPrompt('用户是一名工程师，偏好短句交流。', null)).toBe(
      '用户是一名工程师，偏好短句交流。',
    );
  });

  it('formats summary with facets', () => {
    const result = formatProfileForPrompt('用户注重规律作息。', {
      nickname: 'Tom',
      active_goals: ['早睡', '跑步'],
    });

    expect(result).toContain('用户注重规律作息。');
    expect(result).toContain('结构化画像：');
    expect(result).toContain('- 昵称：Tom');
    expect(result).toContain('- 当前目标：早睡、跑步');
  });

  it('formats facets only', () => {
    const result = formatProfileForPrompt(null, {
      occupation: '工程师',
    });

    expect(result).toContain('结构化画像：');
    expect(result).toContain('- 职业：工程师');
    expect(result).not.toContain('目前暂无特殊偏好记录');
  });
});

describe('buildProfileRefreshPrompt', () => {
  it('includes reference memories and stats', () => {
    const prompt = buildProfileRefreshPrompt({
      existingSummary: '用户喜欢跑步。',
      existingFacets: { nickname: 'Tom' },
      referenceMemories: [
        { text: '用户每周跑步三次', type: 'preference', confidence: 0.9 },
      ],
      stats: {
        activeMemoryCount: 10,
        byType: { preference: 4, event: 3, fact: 3 },
      },
    });

    expect(prompt).toContain('【现有画像 summary】');
    expect(prompt).toContain('用户喜欢跑步。');
    expect(prompt).toContain('用户每周跑步三次');
    expect(prompt).toContain('【参考记忆（高置信度与活跃度优先）】');
    expect(prompt).toContain('活跃记忆总数：10');
  });

  it('handles empty reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existingSummary: null,
      existingFacets: undefined,
      referenceMemories: [],
      stats: {
        activeMemoryCount: 0,
        byType: { preference: 0, event: 0, fact: 0 },
      },
    });

    expect(prompt).toContain('【参考记忆（高置信度与活跃度优先）】');
    expect(prompt).toContain('（无）');
    expect(prompt).toContain('活跃记忆总数：0');
  });
});
