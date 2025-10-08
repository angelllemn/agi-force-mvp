import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetPrismaDatabase, setupPrismaTestContainer, teardownPrismaTestContainer } from '../utils/prisma-test-container.js';

type PostgresRepositoryCtor = typeof import('../../src/adapters/postgres/PostgresConversationRepository.js')['PostgresConversationRepository'];
type CreateContextUseCaseCtor = typeof import('../../src/core/use-cases/CreateContextUseCase.js')['CreateContextUseCase'];
type AddMessageUseCaseCtor = typeof import('../../src/core/use-cases/AddMessageUseCase.js')['AddMessageUseCase'];
type RetrieveContextUseCaseCtor = typeof import('../../src/core/use-cases/RetrieveContextUseCase.js')['RetrieveContextUseCase'];

let PostgresConversationRepository: PostgresRepositoryCtor;
let CreateContextUseCase: CreateContextUseCaseCtor;
let AddMessageUseCase: AddMessageUseCaseCtor;
let RetrieveContextUseCase: RetrieveContextUseCaseCtor;

let repository: InstanceType<PostgresRepositoryCtor>;
let createContextUseCase: InstanceType<CreateContextUseCaseCtor>;
let addMessageUseCase: InstanceType<AddMessageUseCaseCtor>;
let retrieveContextUseCase: InstanceType<RetrieveContextUseCaseCtor>;

beforeAll(async () => {
  await setupPrismaTestContainer();
  ({ PostgresConversationRepository } = await import('../../src/adapters/postgres/PostgresConversationRepository.js'));
  ({ CreateContextUseCase } = await import('../../src/core/use-cases/CreateContextUseCase.js'));
  ({ AddMessageUseCase } = await import('../../src/core/use-cases/AddMessageUseCase.js'));
  ({ RetrieveContextUseCase } = await import('../../src/core/use-cases/RetrieveContextUseCase.js'));
}, 60000);

afterAll(async () => {
  await teardownPrismaTestContainer();
}, 60000);

beforeEach(async () => {
  await resetPrismaDatabase();

  repository = new PostgresConversationRepository();
  createContextUseCase = new CreateContextUseCase(repository);
  addMessageUseCase = new AddMessageUseCase(repository);
  retrieveContextUseCase = new RetrieveContextUseCase(repository);
});

describe('PostgresConversationRepository integration', () => {
  it('persists conversations and messages in PostgreSQL', async () => {
    const context = await createContextUseCase.execute('user', ['user-123']);
    expect(context.id).toBeDefined();

    await addMessageUseCase.execute(context.id, 'user-123', 'Hello from Postgres!', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Hi there!', new Date());

    const history = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['user-123'],
      limit: 10,
    });

    expect(history.messages).toHaveLength(2);
    expect(history.messages.map((m) => m.content)).toEqual([
      'Hello from Postgres!',
      'Hi there!',
    ]);
  });

  it('filters contexts by participants when retrieving', async () => {
    const [userContext, groupContext] = await Promise.all([
      createContextUseCase.execute('user', ['user-123']),
      createContextUseCase.execute('group', ['channel-abc']),
    ]);

    await addMessageUseCase.execute(userContext.id, 'user-123', 'User ping', new Date());
    await addMessageUseCase.execute(groupContext.id, 'BOT', 'Group hello', new Date());

    const userHistory = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['user-123'],
      limit: 5,
    });

    expect(userHistory.context.id).toBe(userContext.id);
    expect(userHistory.messages).toHaveLength(1);
    expect(userHistory.messages[0].content).toBe('User ping');
  });
});
