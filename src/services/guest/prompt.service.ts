import { prisma } from '@/lib/server/prisma';
import { interpolate } from '@/prompts/interpolate';
import { readPromptFile } from '@/prompts/load';
import { parseCharacterProfile } from '@/services/character/definition.utils';
import { formatRuntimeContext } from '@/services/chat/format.utils';
import { getGuestCharacter } from '@/services/guest/catalog.service';
import { type JsonObject, jsonToYaml } from '@/utils/json-yaml';
import { xmlBlock } from '@/utils/xml-block';

export type GuestSystemPromptResult = {
  systemPrompt: string;
  character: {
    id: string;
    slug: string;
    name: string;
    hasAvatar: boolean;
    avatarUpdatedAt: string;
  };
};

/**
 * 试聊专用 system prompt：角色人设 + 回复规则 + 运行时上下文；无记忆/画像。
 */
export async function buildGuestSystemPrompt(
  characterId: string,
  timeZone: string,
  previousMessageAt: Date | null,
): Promise<GuestSystemPromptResult> {
  const catalog = await getGuestCharacter(characterId);
  const row = await prisma.character.findUniqueOrThrow({
    where: { id: characterId },
    select: { profile: true },
  });

  const persona = parseCharacterProfile(row.profile);
  const vars = { name: catalog.name, slug: catalog.slug };
  const characterProfile = interpolate(jsonToYaml(persona as JsonObject), vars);
  const runtimeContext = formatRuntimeContext(new Date(), timeZone, previousMessageAt);
  const replyRules = readPromptFile('reply-rules.md');

  const systemPrompt = [
    xmlBlock('character_profile', characterProfile),
    xmlBlock('reply_rules', replyRules),
    xmlBlock('runtime_context', runtimeContext),
  ].join('\n\n');

  return {
    systemPrompt,
    character: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      hasAvatar: catalog.hasAvatar,
      avatarUpdatedAt: catalog.avatarUpdatedAt,
    },
  };
}
