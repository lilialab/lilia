import { prisma } from '../src/lib/server/prisma';
import { registerUser } from '../src/services/user/users.service';

const CHARACTER_SLUGS = ['arbor', 'bob', 'cindy', 'dave'] as const;

const SEED_USER = {
  username: 'tom',
  displayName: 'Tom',
  password: '123123123',
  locale: 'zh',
} as const;

async function main() {
  for (const slug of CHARACTER_SLUGS) {
    await prisma.character.upsert({
      where: { slug },
      create: { slug },
      update: {},
    });
  }

  const existing = await prisma.user.findUnique({
    where: { username: SEED_USER.username },
    select: { id: true },
  });
  if (!existing) {
    await registerUser(SEED_USER);
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
