import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationRepository } from '../../src/adapters/memory/InMemoryConversationRepository.js';
import { CreateContextUseCase } from '../../src/core/use-cases/CreateContextUseCase.js';
import { AddMessageUseCase } from '../../src/core/use-cases/AddMessageUseCase.js';
import { RetrieveContextUseCase } from '../../src/core/use-cases/RetrieveContextUseCase.js';
import { ContextAlreadyExistsError } from '../../src/core/errors/ContextErrors.js';

describe('User DM Context Flow', () => {
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

  it('should create a new user context', async () => {
    const context = await createContextUseCase.execute('user', ['U12345']);
    
    expect(context).toBeDefined();
    expect(context.type).toBe('user');
    expect(context.participants).toEqual(['U12345']);
    expect(context.id).toBeDefined();
  });

  it('should not create duplicate context for same user', async () => {
    await createContextUseCase.execute('user', ['U12345']);
    
    await expect(
      createContextUseCase.execute('user', ['U12345'])
    ).rejects.toThrow(ContextAlreadyExistsError);
  });

  it('should add messages to user context', async () => {
    const context = await createContextUseCase.execute('user', ['U12345']);
    
    const message1 = await addMessageUseCase.execute(
      context.id,
      'U12345',
      'Hello bot!',
      new Date()
    );
    
    const message2 = await addMessageUseCase.execute(
      context.id,
      'BOT',
      'Hello! How can I help you?',
      new Date()
    );
    
    expect(message1.content).toBe('Hello bot!');
    expect(message2.content).toBe('Hello! How can I help you?');
  });

  it('should retrieve conversation history with messages', async () => {
    const context = await createContextUseCase.execute('user', ['U12345']);
    
    await addMessageUseCase.execute(context.id, 'U12345', 'Message 1', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Response 1', new Date());
    await addMessageUseCase.execute(context.id, 'U12345', 'Message 2', new Date());
    
    const history = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['U12345'],
    });
    
    expect(history.context.id).toBe(context.id);
    expect(history.messages).toHaveLength(3);
    expect(history.messageCount).toBe(3);
  });

  it('should maintain separate contexts for different users', async () => {
    const context1 = await createContextUseCase.execute('user', ['U12345']);
    const context2 = await createContextUseCase.execute('user', ['U67890']);
    
    await addMessageUseCase.execute(context1.id, 'U12345', 'User 1 message', new Date());
    await addMessageUseCase.execute(context2.id, 'U67890', 'User 2 message', new Date());
    
    const history1 = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['U12345'],
    });
    
    const history2 = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['U67890'],
    });
    
    expect(history1.messages).toHaveLength(1);
    expect(history1.messages[0].content).toBe('User 1 message');
    
    expect(history2.messages).toHaveLength(1);
    expect(history2.messages[0].content).toBe('User 2 message');
  });

  it('should reference previous conversation context', async () => {
    const context = await createContextUseCase.execute('user', ['U12345']);
    
    // First conversation
    await addMessageUseCase.execute(context.id, 'U12345', 'What is Node.js?', new Date());
    await addMessageUseCase.execute(context.id, 'BOT', 'Node.js is a JavaScript runtime...', new Date());
    
    // Later conversation referencing previous topic
    await addMessageUseCase.execute(context.id, 'U12345', 'Can you tell me more about that?', new Date());
    
    const history = await retrieveContextUseCase.execute({
      type: 'user',
      participants: ['U12345'],
    });
    
    // Bot should have access to previous messages for context
    expect(history.messages).toHaveLength(3);
    expect(history.messages[0].content).toContain('Node.js');
  });
});
