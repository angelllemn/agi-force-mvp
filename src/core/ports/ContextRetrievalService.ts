import type { ContextType, Participant } from '../entities/ConversationContext.js';
import type { ConversationHistory } from '../entities/ConversationHistory.js';
import type { Message } from '../entities/Message.js';
import type { ContextFilter, MessageFilter } from '../value-objects/Filters.js';

export interface ContextRetrievalService {
  findRelevantContext(filter: ContextFilter): Promise<ConversationHistory[]>;
  getLatestMessages(filter: MessageFilter): Promise<Message[]>;
  checkContextExists(participants: Participant[], type: ContextType): Promise<boolean>;
}
