import { randomUUID } from 'crypto';
import type { ContextId, ContextType, ConversationContext, Participant } from '../../core/entities/ConversationContext.js';
import { ConversationContextEntity } from '../../core/entities/ConversationContext.js';
import type { ConversationHistory } from '../../core/entities/ConversationHistory.js';
import { ConversationHistoryAggregate } from '../../core/entities/ConversationHistory.js';
import type { Message } from '../../core/entities/Message.js';
import { MessageEntity } from '../../core/entities/Message.js';
import { ContextNotFoundError } from '../../core/errors/ContextErrors.js';
import type { ConversationRepository } from '../../core/ports/ConversationRepository.js';
import type { ContextFilter, MessageFilter } from '../../core/value-objects/Filters.js';

export class InMemoryConversationRepository implements ConversationRepository {
  private contexts: Map<ContextId, ConversationContext> = new Map();
  private messages: Map<ContextId, Message[]> = new Map();

  async createContext(type: ContextType, participants: Participant[]): Promise<ConversationContext> {
    const id = randomUUID();
    const context = ConversationContextEntity.create(id, type, participants);
    this.contexts.set(id, context);
    this.messages.set(id, []);
    return context;
  }

  async findContext(filter: ContextFilter): Promise<ConversationContext | null> {
    for (const context of this.contexts.values()) {
      // Match type if specified
      if (filter.type && context.type !== filter.type) {
        continue;
      }

      // Match participants
      const participantsMatch = filter.participants.every(p => 
        context.participants.includes(p)
      ) && context.participants.every(p => 
        filter.participants.includes(p)
      );

      if (!participantsMatch) {
        continue;
      }

      // Check expiration
      if (!filter.includeExpired && context.expiresAt < new Date()) {
        continue;
      }

      // Check since date
      if (filter.since && context.createdAt < filter.since) {
        continue;
      }

      return context;
    }

    return null;
  }

  async updateContextActivity(contextId: ContextId): Promise<void> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new ContextNotFoundError(`Context not found: ${contextId}`);
    }

    const updated = ConversationContextEntity.fromData(context).updateActivity();
    this.contexts.set(contextId, updated);
  }

  async addMessage(
    contextId: ContextId,
    sender: Participant,
    content: string,
    timestamp: Date
  ): Promise<Message> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new ContextNotFoundError(`Context not found: ${contextId}`);
    }

    const id = randomUUID();
    const message = MessageEntity.create(id, contextId, sender, content, timestamp);
    
    const messages = this.messages.get(contextId) || [];
    messages.push(message);
    this.messages.set(contextId, messages);

    return message;
  }

  async getMessages(filter: MessageFilter): Promise<Message[]> {
    const messages = this.messages.get(filter.contextId) || [];
    
    let filtered = [...messages];

    // Filter by date range
    if (filter.since) {
      filtered = filtered.filter(m => m.timestamp >= filter.since!);
    }
    if (filter.until) {
      filtered = filtered.filter(m => m.timestamp <= filter.until!);
    }

    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  async getConversationHistory(filter: ContextFilter): Promise<ConversationHistory> {
    const context = await this.findContext(filter);
    if (!context) {
      throw new ContextNotFoundError('Context not found');
    }

    const messages = await this.getMessages({
      contextId: context.id,
      limit: filter.limit,
    });

    return ConversationHistoryAggregate.create(context, messages);
  }

  async findExpiredContexts(cutoffDate: Date): Promise<ConversationContext[]> {
    const expired: ConversationContext[] = [];
    for (const context of this.contexts.values()) {
      if (context.expiresAt < cutoffDate) {
        expired.push(context);
      }
    }
    return expired;
  }

  async deleteContext(contextId: ContextId): Promise<void> {
    this.contexts.delete(contextId);
    this.messages.delete(contextId);
  }

  // Test helper methods
  clear(): void {
    this.contexts.clear();
    this.messages.clear();
  }

  getContextCount(): number {
    return this.contexts.size;
  }

  getMessageCount(contextId: ContextId): number {
    return this.messages.get(contextId)?.length || 0;
  }
}
