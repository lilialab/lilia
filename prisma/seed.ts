import { prisma } from '../src/lib/server/prisma';

const CHARACTERS = [
  { slug: 'arbor', displayName: '阿尔博' },
  { slug: 'bob', displayName: '鲍勃' },
  { slug: 'cindy', displayName: '辛迪' },
  { slug: 'dave', displayName: '戴夫' },
] as const;

async function main() {
  for (const character of CHARACTERS) {
    await prisma.character.upsert({
      where: { slug: character.slug },
      create: {
        slug: character.slug,
        displayName: character.displayName,
      },
      update: {
        displayName: character.displayName,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err: unknown) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
