import { prisma } from '../src/lib/server/prisma';

export const CHARACTER_SLUGS = ['lilia', 'einstein', 'socrates'] as const;

/** 按 slug upsert 角色目录（幂等，不删除库中多余角色）。 */
export async function seedCharacterCatalog(): Promise<void> {
  for (const slug of CHARACTER_SLUGS) {
    await prisma.character.upsert({
      where: { slug },
      create: { slug },
      update: {},
    });
  }
}
