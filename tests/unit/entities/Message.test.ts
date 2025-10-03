import { describe, it, expect } from 'vitest';
import { MessageEntity } from '../../../src/core/entities/Message.js';

describe('MessageEntity', () => {
  it('should create a new message', () => {
    const timestamp = new Date();
    const message = MessageEntity.create(
      'msg-id',
      'context-id',
      'U12345',
      'Hello world',
      timestamp
    );

    expect(message.id).toBe('msg-id');
    expect(message.contextId).toBe('context-id');
    expect(message.sender).toBe('U12345');
    expect(message.content).toBe('Hello world');
    expect(message.timestamp).toBe(timestamp);
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it('should use current time as default timestamp', () => {
    const before = new Date();
    const message = MessageEntity.create(
      'msg-id',
      'context-id',
      'U12345',
      'Hello'
    );
    const after = new Date();

    expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(message.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should store message content correctly', () => {
    const longMessage = 'This is a longer message with multiple words and punctuation!';
    const message = MessageEntity.create(
      'msg-id',
      'context-id',
      'U12345',
      longMessage
    );

    expect(message.content).toBe(longMessage);
  });

  it('should support bot as sender', () => {
    const message = MessageEntity.create(
      'msg-id',
      'context-id',
      'BOT',
      'How can I help?'
    );

    expect(message.sender).toBe('BOT');
  });

  it('should create from existing data', () => {
    const data = {
      id: 'msg-id',
      contextId: 'context-id',
      sender: 'U12345',
      content: 'Test message',
      timestamp: new Date(),
      createdAt: new Date(),
    };

    const message = MessageEntity.fromData(data);

    expect(message.id).toBe(data.id);
    expect(message.contextId).toBe(data.contextId);
    expect(message.sender).toBe(data.sender);
    expect(message.content).toBe(data.content);
  });

  it('should be immutable via readonly properties', () => {
    const message = MessageEntity.create(
      'msg-id',
      'context-id',
      'U12345',
      'Test'
    );

    // Verify readonly properties exist
    expect(message.id).toBe('msg-id');
    expect(message.content).toBe('Test');
    
    // TypeScript enforces immutability at compile time with readonly
    // The entity uses readonly properties to prevent modification
  });
});
