import { getGuestCharacter } from '@/services/guest/catalog.service';
import { clearGuestTrialMessages } from '@/services/guest/message.service';
import { getGuestTrialDailyTurnUsage } from '@/services/guest/trial-quota.service';

export type GuestChatOpenSummary = {
  characterId: string;
  slug: string;
  name: string;
  hasAvatar: boolean;
  avatarUpdatedAt: string;
  remaining: number;
  limit: number;
};

/**
 * 打开访客试聊：校验角色、清空该 guest×角色历史、返回用量。
 */
export async function openGuestChat(
  guestId: string,
  characterId: string,
): Promise<GuestChatOpenSummary> {
  const character = await getGuestCharacter(characterId);
  await clearGuestTrialMessages(guestId, characterId);
  const usage = await getGuestTrialDailyTurnUsage(guestId);
  return {
    characterId: character.id,
    slug: character.slug,
    name: character.name,
    hasAvatar: character.hasAvatar,
    avatarUpdatedAt: character.avatarUpdatedAt,
    remaining: usage.remaining,
    limit: usage.limit,
  };
}
