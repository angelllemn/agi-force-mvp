import { describe, it, expect } from 'vitest';
import { ConversationContextEntity } from '../../../src/core/entities/ConversationContext.js';

describe('ConversationContextEntity', () => {
  it('should create a new context with proper defaults', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'user',
      ['U12345']
    );

    expect(context.id).toBe('test-id');
    expect(context.type).toBe('user');
    expect(context.participants).toEqual(['U12345']);
    expect(context.createdAt).toBeInstanceOf(Date);
    expect(context.updatedAt).toBeInstanceOf(Date);
    expect(context.expiresAt).toBeInstanceOf(Date);
  });

  it('should set expiration to 30 days by default', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'user',
      ['U12345']
    );

    const daysDiff = Math.floor(
      (context.expiresAt.getTime() - context.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysDiff).toBe(30);
  });

  it('should allow custom retention days', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'user',
      ['U12345'],
      60
    );

    const daysDiff = Math.floor(
      (context.expiresAt.getTime() - context.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysDiff).toBe(60);
  });

  it('should support group context type', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'group',
      ['C12345']
    );

    expect(context.type).toBe('group');
    expect(context.participants).toEqual(['C12345']);
  });

  it('should support multiple participants', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'group',
      ['U12345', 'U67890', 'U11111']
    );

    expect(context.participants).toHaveLength(3);
    expect(context.participants).toContain('U12345');
    expect(context.participants).toContain('U67890');
    expect(context.participants).toContain('U11111');
  });

  it('should update activity and extend expiration', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'user',
      ['U12345']
    );

    const originalExpiry = context.expiresAt;

    // Update activity
    const updated = context.updateActivity();

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(context.updatedAt.getTime());
    expect(updated.expiresAt.getTime()).toBeGreaterThanOrEqual(originalExpiry.getTime());
  });

  it('should detect expired contexts', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
    
    const context = ConversationContextEntity.fromData({
      id: 'test-id',
      type: 'user',
      participants: ['U12345'],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: pastDate,
    });

    expect(context.isExpired()).toBe(true);
  });

  it('should detect non-expired contexts', () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'user',
      ['U12345']
    );

    expect(context.isExpired()).toBe(false);
  });

  it('should be immutable', async () => {
    const context = ConversationContextEntity.create(
      'test-id',
      'user',
      ['U12345']
    );

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updated = context.updateActivity();

    // Original should not be the same object
    expect(context).not.toBe(updated);
    // Updated timestamp should be later than or equal to original
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(context.updatedAt.getTime());
  });
});
