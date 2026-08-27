// import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { env } from '@/lib/server/env';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const prismaClientSingleton = () => {
  const adapter = new PrismaMariaDb({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    connectionLimit: 20,

    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
