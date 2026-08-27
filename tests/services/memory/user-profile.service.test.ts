import { buildProfileRefreshPrompt } from '@/services/memory/user-profile.service';
import { describe, expect, it } from 'vitest';

describe('buildProfileRefreshPrompt', () => {
  it('includes existing profile and reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existingText: 'nickname: Tom\ncommunication_style: 短句，别说教',
      referenceMemories: [
        { text: '用户每周跑步三次', type: 'preference', confidence: 0.9 },
      ],
    });

    expect(prompt).toContain('【现有画像】');
    expect(prompt).toContain('nickname: Tom');
    expect(prompt).toContain('用户每周跑步三次');
    expect(prompt).toContain('【参考记忆（高置信度与活跃度优先）】');
    expect(prompt).not.toContain('【记忆库统计】');
  });

  it('handles empty profile and reference memories', () => {
    const prompt = buildProfileRefreshPrompt({
      existingText: null,
      referenceMemories: [],
    });

    expect(prompt).toContain('（无）');
    expect(prompt).toContain('【参考记忆（高置信度与活跃度优先）】');
  });
});
