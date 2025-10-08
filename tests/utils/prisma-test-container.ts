import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

const POSTGRES_IMAGE = 'postgres:16-alpine';

let startedContainer: StartedPostgreSqlContainer | null = null;
let prismaModule: typeof import('../../src/infra/persistence/prismaClient.js') | null = null;

export async function setupPrismaTestContainer(): Promise<string> {
  if (startedContainer) {
    return startedContainer.getConnectionUri();
  }

  startedContainer = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
    .start();

  const connectionUri = startedContainer.getConnectionUri();

  process.env.DATABASE_URL = connectionUri;
  process.env.PERSISTENCE_DRIVER = 'postgres';
  process.env.NODE_ENV = 'test';

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionUri,
    },
  });

  prismaModule = await import('../../src/infra/persistence/prismaClient.js');

  return connectionUri;
}

export async function resetPrismaDatabase(): Promise<void> {
  if (!prismaModule) {
    return;
  }

  const prisma = prismaModule.getPrismaClient();
  await prisma.conversationMessage.deleteMany();
  await prisma.contextParticipant.deleteMany();
  await prisma.conversationContext.deleteMany();
}

export async function teardownPrismaTestContainer(): Promise<void> {
  if (prismaModule) {
    const prisma = prismaModule.getPrismaClient();
    await prisma.$disconnect();
    prismaModule = null;
  }

  if (startedContainer) {
    await startedContainer.stop();
    startedContainer = null;
  }
}
