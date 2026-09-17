import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/guest/catalog.service', () => ({
  getGuestCharacter: vi.fn(),
}));

vi.mock('@/services/guest/message.service', () => ({
  clearGuestTrialMessages: vi.fn(),
}));

vi.mock('@/services/guest/trial-quota.service', () => ({
  getGuestTrialDailyTurnUsage: vi.fn(),
}));

import { getGuestCharacter } from '@/services/guest/catalog.service';
import { openGuestChat } from '@/services/guest/chat-open.service';
import { clearGuestTrialMessages } from '@/services/guest/message.service';
import { getGuestTrialDailyTurnUsage } from '@/services/guest/trial-quota.service';

describe('openGuestChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGuestCharacter).mockResolvedValue({
      id: 'char-1',
      slug: 'rin',
      name: '凛',
      shortBio: '',
      hasAvatar: false,
      avatarUpdatedAt: '2026-09-17T00:00:00.000Z',
      isOfficial: false,
    });
    vi.mocked(getGuestTrialDailyTurnUsage).mockResolvedValue({
      used: 2,
      limit: 10,
      remaining: 8,
    });
    vi.mocked(clearGuestTrialMessages).mockResolvedValue(undefined);
  });

  it('校验角色、清空历史并返回用量', async () => {
    await expect(openGuestChat('guest-abc', 'char-1')).resolves.toMatchObject({
      characterId: 'char-1',
      slug: 'rin',
      name: '凛',
      remaining: 8,
      limit: 10,
    });
    expect(clearGuestTrialMessages).toHaveBeenCalledWith('guest-abc', 'char-1');
  });
});
