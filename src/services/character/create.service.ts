import { AppError } from '@/lib/server/app-error';
import { env } from '@/lib/server/env';
import { prisma } from '@/lib/server/prisma';
import { assertRateLimits } from '@/lib/server/rate-limit';
import { buildCreateCharacterProfile } from '@/services/character/create.utils';
import {
  catalogCharacterSelect,
  type CharacterCatalogItem,
  toCharacterCatalogItem,
} from '@/services/character/definition.utils';
import { API_ERROR_CODE } from '@/types/api-error';
import { formatUtcDate, secondsUntilNextUtcMidnight } from '@/utils/utc-day';

const DEFAULT_EXTRACT =
  'Also watch for:\n- Boundaries and sore spots: topics they clearly dislike or want avoided\n- People who matter to them, and how those relationships are going\n- Shared language with this character: nicknames, in-jokes, terms you both use';

const CHARACTER_CREATE_DAILY_LIMIT_MESSAGE = '今日新建角色次数已用完，请明天再试';

/** 消耗一次 UTC 日新建角色配额；超限抛 429。 */
async function assertCharacterCreateDailyQuota(userId: string, now = new Date()): Promise<void> {
  await assertRateLimits([
    {
      key: `ratelimit:character:create:daily:${userId}:${formatUtcDate(now)}`,
      limit: env.CHARACTER_CREATE_DAILY_LIMIT,
      windowSeconds: secondsUntilNextUtcMidnight(now),
      message: CHARACTER_CREATE_DAILY_LIMIT_MESSAGE,
      code: API_ERROR_CODE.CHARACTER_CREATE_DAILY_LIMIT,
    },
  ]);
}

/** 新建目录角色（全局可见；创建者不自动加好友）。 */
export async function createCharacter(
  ownerUserId: string,
  input: {
    slug: string;
    name: string;
    shortBio: string;
    gender: string;
    age?: string;
    height?: string;
    occupation?: string;
    relation?: string;
    attitude?: string;
    personality?: string[];
    values?: string[];
    dislikes?: string[];
  },
): Promise<CharacterCatalogItem> {
  const existing = await prisma.character.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) {
    throw AppError.badRequest('该账号名已被占用', API_ERROR_CODE.CHARACTER_SLUG_TAKEN);
  }

  await assertCharacterCreateDailyQuota(ownerUserId);

  const row = await prisma.character.create({
    data: {
      slug: input.slug,
      name: input.name,
      shortBio: input.shortBio,
      ownerId: ownerUserId,
      profile: buildCreateCharacterProfile({
        gender: input.gender,
        age: input.age,
        height: input.height,
        occupation: input.occupation,
        relation: input.relation,
        attitude: input.attitude,
        personality: input.personality,
        values: input.values,
        dislikes: input.dislikes,
      }),
      skills: [],
      extract: DEFAULT_EXTRACT,
    },
    select: catalogCharacterSelect,
  });

  return toCharacterCatalogItem(row);
}
