import { InMemoryContextCleanupService } from '../../adapters/memory/InMemoryContextCleanupService.js';
import { InMemoryConversationRepository } from '../../adapters/memory/InMemoryConversationRepository.js';
import { PostgresConversationRepository } from '../../adapters/postgres/PostgresConversationRepository.js';
import { SlackContextIntegration } from '../../adapters/slack/SlackContextIntegration.js';
import type { ContextCleanupService } from '../../core/ports/ContextCleanupService.js';
import type { ConversationRepository } from '../../core/ports/ConversationRepository.js';
import { CleanupExpiredContextsUseCase } from '../../core/use-cases/CleanupExpiredContextsUseCase.js';
import type { Env } from '../config/env.js';
import { validateEnv } from '../config/env.js';
import { getPrismaClient } from '../persistence/prismaClient.js';

export type PersistenceDriver = 'memory' | 'postgres' | 'sqlite';

export interface ContainerOptions {
  env?: Env;
  driver?: PersistenceDriver;
  overrides?: Partial<ContainerOverrides>;
}

interface ContainerOverrides {
  conversationRepository: ConversationRepository;
  cleanupService: ContextCleanupService;
  slackContextIntegration: SlackContextIntegration;
}

export interface AppContainer {
  readonly env: Env;
  readonly driver: PersistenceDriver;
  resolveConversationRepository(): ConversationRepository;
  resolveCleanupService(): ContextCleanupService;
  resolveCleanupExpiredContextsUseCase(): CleanupExpiredContextsUseCase;
  resolveSlackContextIntegration(): SlackContextIntegration;
  dispose(): Promise<void>;
}

export function createAppContainer(options: ContainerOptions = {}): AppContainer {
  const env = options.env ?? validateEnv();
  const driver = options.driver ?? inferDriverFromEnv(env);
  const overrides = options.overrides ?? {};

  let conversationRepository: ConversationRepository | undefined = overrides.conversationRepository;
  let cleanupService: ContextCleanupService | undefined = overrides.cleanupService;
  let cleanupUseCase: CleanupExpiredContextsUseCase | undefined;
  let slackContextIntegration: SlackContextIntegration | undefined = overrides.slackContextIntegration;
  let disposed = false;

  return {
    env,
    driver,
    resolveConversationRepository(): ConversationRepository {
      if (!conversationRepository) {
        conversationRepository = createRepository(driver);
      }
      return conversationRepository;
    },
    resolveCleanupService(): ContextCleanupService {
      if (!cleanupService) {
        cleanupService = new InMemoryContextCleanupService(this.resolveConversationRepository());
      }
      return cleanupService;
    },
    resolveCleanupExpiredContextsUseCase(): CleanupExpiredContextsUseCase {
      if (!cleanupUseCase) {
        cleanupUseCase = new CleanupExpiredContextsUseCase(
          this.resolveConversationRepository(),
          this.resolveCleanupService()
        );
      }
      return cleanupUseCase;
    },
    resolveSlackContextIntegration(): SlackContextIntegration {
      if (!slackContextIntegration) {
        slackContextIntegration = new SlackContextIntegration(this.resolveConversationRepository());
      }
      return slackContextIntegration;
    },
    async dispose(): Promise<void> {
      if (disposed) {
        return;
      }
      disposed = true;

      if (driver === 'postgres' || driver === 'sqlite') {
        await getPrismaClient().$disconnect();
      }
    },
  };
}

function inferDriverFromEnv(env: Env): PersistenceDriver {
  if (env.PERSISTENCE_DRIVER) {
    return env.PERSISTENCE_DRIVER;
  }

  const url = env.DATABASE_URL?.toLowerCase();
  if (url?.startsWith('postgresql://')) {
    return 'postgres';
  }
  if (url?.startsWith('file:')) {
    return 'sqlite';
  }
  return 'memory';
}

function createRepository(driver: PersistenceDriver): ConversationRepository {
  switch (driver) {
    case 'postgres':
    case 'sqlite':
      return new PostgresConversationRepository();
    case 'memory':
    default:
      return new InMemoryConversationRepository();
  }
}
