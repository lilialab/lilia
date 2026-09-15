import { prisma } from '../src/lib/server/prisma';
import { seedCharacterCatalog } from './seed-catalog';
import { seedOfficialUser } from './seed-official-user';

async function main() {
  const officialUserId = await seedOfficialUser();
  await seedCharacterCatalog(officialUserId);
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
