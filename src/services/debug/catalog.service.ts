import { prisma } from '@/lib/server/prisma';

/** 调试页角色下拉：库中 slug，按创建时间。 */
export async function listCatalogSlugs(): Promise<string[]> {
  const rows = await prisma.character.findMany({
    select: { slug: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => row.slug);
}
