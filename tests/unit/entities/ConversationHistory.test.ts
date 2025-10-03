import { describe, it, expect } from 'vitest';
import { ConversationHistoryAggregate } from '../../../src/core/entities/ConversationHistory.js';
import { ConversationContextEntity } from '../../../src/core/entities/ConversationContext.js';
import { MessageEntity } from '../../../src/core/entities/Message.js';

describe('ConversationHistoryAggregate', () => {
  it('should create history with context and messages', () => {
    const context = ConversationContextEntity.create('ctx-id', 'user', ['U12345']);
    const messages = [
      MessageEntity.create('msg-1', 'ctx-id', 'U12345', 'Message 1'),
      MessageEntity.create('msg-2', 'ctx-id', 'BOT', 'Response 1'),
    ];

    const history = ConversationHistoryAggregate.create(context, messages);

    expect(history.context).toBe(context);
    expect(history.messages).toHaveLength(2);
    expect(history.messageCount).toBe(2);
  });

  it('should handle empty message list', () => {
    const context = ConversationContextEntity.create('ctx-id', 'user', ['U12345']);
    const history = ConversationHistoryAggregate.create(context, []);

    expect(history.messageCount).toBe(0);
    expect(history.messages).toHaveLength(0);
  });

  it('should calculate last activity from messages', () => {
    const context = ConversationContextEntity.create('ctx-id', 'user', ['U12345']);
    const timestamp1 = new Date('2024-01-01T10:00:00Z');
    const timestamp2 = new Date('2024-01-01T11:00:00Z');
    const timestamp3 = new Date('2024-01-01T12:00:00Z');

    const messages = [
      MessageEntity.create('msg-1', 'ctx-id', 'U12345', 'Message 1', timestamp1),
      MessageEntity.create('msg-2', 'ctx-id', 'BOT', 'Response 1', timestamp2),
      MessageEntity.create('msg-3', 'ctx-id', 'U12345', 'Message 2', timestamp3),
    ];

    const history = ConversationHistoryAggregate.create(context, messages);

    expect(history.lastActivity).toEqual(timestamp3);
  });

  it('should use context updated time when no messages', () => {
    const context = ConversationContextEntity.create('ctx-id', 'user', ['U12345']);
    const history = ConversationHistoryAggregate.create(context, []);

    expect(history.lastActivity).toEqual(context.updatedAt);
  });

  it('should preserve message order', () => {
    const context = ConversationContextEntity.create('ctx-id', 'user', ['U12345']);
    const messages = [
      MessageEntity.create('msg-1', 'ctx-id', 'U12345', 'First'),
      MessageEntity.create('msg-2', 'ctx-id', 'BOT', 'Second'),
      MessageEntity.create('msg-3', 'ctx-id', 'U12345', 'Third'),
    ];

    const history = ConversationHistoryAggregate.create(context, messages);

    expect(history.messages[0].content).toBe('First');
    expect(history.messages[1].content).toBe('Second');
    expect(history.messages[2].content).toBe('Third');
  });

  it('should count messages correctly', () => {
    const context = ConversationContextEntity.create('ctx-id', 'user', ['U12345']);
    const messages = Array.from({ length: 10 }, (_, i) =>
      MessageEntity.create(`msg-${i}`, 'ctx-id', 'U12345', `Message ${i}`)
    );

    const history = ConversationHistoryAggregate.create(context, messages);

    expect(history.messageCount).toBe(10);
    expect(history.messages.length).toBe(10);
  });
});
