import { prisma } from '../src/lib/server/prisma';
import { seedCharacterCatalog } from './seed-catalog';
import { seedDevUser } from './seed-dev-user';

async function main() {
  await seedCharacterCatalog();
  await seedDevUser();
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
