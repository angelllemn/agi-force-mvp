import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationRepository } from '../../src/adapters/memory/InMemoryConversationRepository.js';
import { CreateContextUseCase } from '../../src/core/use-cases/CreateContextUseCase.js';
import { AddMessageUseCase } from '../../src/core/use-cases/AddMessageUseCase.js';
import { RetrieveContextUseCase } from '../../src/core/use-cases/RetrieveContextUseCase.js';

describe('Group Context Flow', () => {
  let repository: InMemoryConversationRepository;
  let createContextUseCase: CreateContextUseCase;
  let addMessageUseCase: AddMessageUseCase;
  let retrieveContextUseCase: RetrieveContextUseCase;

  beforeEach(() => {
    repository = new InMemoryConversationRepository();
    createContextUseCase = new CreateContextUseCase(repository);
    addMessageUseCase = new AddMessageUseCase(repository);
    retrieveContextUseCase = new RetrieveContextUseCase(repository);
  });

  it('should create a new group context', async () => {
    const context = await createContextUseCase.execute('group', ['C12345']);
    
    expect(context).toBeDefined();
    expect(context.type).toBe('group');
    expect(context.participants).toEqual(['C12345']);
  });

  it('should maintain group conversation history', async () => {
    const context = await createContextUseCase.execute('group', ['C12345']);
    
    await addMessageUseCase.execute(context.id, 'U11111', 'Hello team!', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Hello! How can I help?', new Date());
    await addMessageUseCase.execute(context.id, 'U22222', 'We need to discuss the project', new Date());
    
    const history = await retrieveContextUseCase.execute({
      type: 'group',
      participants: ['C12345'],
    });
    
    expect(history.messages).toHaveLength(3);
  });

  it('should separate contexts for different groups', async () => {
    const context1 = await createContextUseCase.execute('group', ['C12345']);
    const context2 = await createContextUseCase.execute('group', ['C67890']);
    
    await addMessageUseCase.execute(context1.id, 'U11111', 'Group 1 discussion', new Date());
    await addMessageUseCase.execute(context2.id, 'U22222', 'Group 2 discussion', new Date());
    
    const history1 = await retrieveContextUseCase.execute({
      type: 'group',
      participants: ['C12345'],
    });
    
    const history2 = await retrieveContextUseCase.execute({
      type: 'group',
      participants: ['C67890'],
    });
    
    expect(history1.messages[0].content).toBe('Group 1 discussion');
    expect(history2.messages[0].content).toBe('Group 2 discussion');
  });

  it('should allow multiple users to participate in group', async () => {
    const context = await createContextUseCase.execute('group', ['C12345']);
    
    await addMessageUseCase.execute(context.id, 'U11111', 'User 1 message', new Date());
    await addMessageUseCase.execute(context.id, 'U22222', 'User 2 message', new Date());
    await addMessageUseCase.execute(context.id, 'U33333', 'User 3 message', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Bot response', new Date());
    
    const history = await retrieveContextUseCase.execute({
      type: 'group',
      participants: ['C12345'],
    });
    
    const senders = new Set(history.messages.map(m => m.sender));
    expect(senders.size).toBe(4); // 3 users + bot
  });

  it('should maintain context for group topic changes', async () => {
    const context = await createContextUseCase.execute('group', ['C12345']);
    
    // Topic 1: Project planning
    await addMessageUseCase.execute(context.id, 'U11111', 'Lets plan the new feature', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Sure, what feature are we planning?', new Date());
    
    // Topic 2: Bug discussion
    await addMessageUseCase.execute(context.id, 'U22222', 'There is a bug in production', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Can you describe the bug?', new Date());
    
    // Bot should have context of both topics
    const history = await retrieveContextUseCase.execute({
      type: 'group',
      participants: ['C12345'],
    });
    
    expect(history.messages).toHaveLength(4);
    expect(history.messages.some(m => m.content.includes('feature'))).toBe(true);
    expect(history.messages.some(m => m.content.includes('bug'))).toBe(true);
  });

  it('should keep user DM and group contexts separate', async () => {
    // User has a DM conversation
    const dmContext = await createContextUseCase.execute('user', ['U11111']);
    await addMessageUseCase.execute(dmContext.id, 'U11111', 'Private question', new Date());
    
    // Same user in a group conversation
    const groupContext = await createContextUseCase.execute('group', ['C12345']);
    await addMessageUseCase.execute(groupContext.id, 'U11111', 'Public question', new Date());
    
    const dmHistory = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['U11111'],
    });
    
    const groupHistory = await retrieveContextUseCase.execute({
      type: 'group',
      participants: ['C12345'],
    });
    
    expect(dmHistory.messages[0].content).toBe('Private question');
    expect(groupHistory.messages[0].content).toBe('Public question');
    expect(dmHistory.context.id).not.toBe(groupHistory.context.id);
  });
});
