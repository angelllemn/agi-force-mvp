import type { ContextId, ContextType, ConversationContext, Participant } from '../entities/ConversationContext.js';
import type { ConversationHistory } from '../entities/ConversationHistory.js';
import type { Message } from '../entities/Message.js';
import type { ContextFilter, MessageFilter } from '../value-objects/Filters.js';

export interface ConversationRepository {
  // Context management
  createContext(type: ContextType, participants: Participant[]): Promise<ConversationContext>;
  findContext(filter: ContextFilter): Promise<ConversationContext | null>;
  updateContextActivity(contextId: ContextId): Promise<void>;

  // Message management
  addMessage(contextId: ContextId, sender: Participant, content: string, timestamp: Date): Promise<Message>;
  getMessages(filter: MessageFilter): Promise<Message[]>;

  // History retrieval
  getConversationHistory(filter: ContextFilter): Promise<ConversationHistory>;

  // Cleanup operations
  findExpiredContexts(cutoffDate: Date): Promise<ConversationContext[]>;
  deleteContext(contextId: ContextId): Promise<void>;
}
