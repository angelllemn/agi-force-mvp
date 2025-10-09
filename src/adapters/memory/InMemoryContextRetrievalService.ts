import type { ContextType, Participant } from '../../core/entities/ConversationContext.js';
import type { ConversationHistory } from '../../core/entities/ConversationHistory.js';
import type { Message } from '../../core/entities/Message.js';
import type { ContextRetrievalService } from '../../core/ports/ContextRetrievalService.js';
import type { ConversationRepository } from '../../core/ports/ConversationRepository.js';
import type { ContextFilter, MessageFilter } from '../../core/value-objects/Filters.js';

export class InMemoryContextRetrievalService implements ContextRetrievalService {
  constructor(private readonly repository: ConversationRepository) { }

  async findRelevantContext(filter: ContextFilter): Promise<ConversationHistory[]> {
    // For MVP, just return single matching context
    // Production implementation would use similarity search, embeddings, etc.
    const context = await this.repository.findContext(filter);
    if (!context) {
      return [];
    }

    const history = await this.repository.getConversationHistory(filter);
    return [history];
  }

  async getLatestMessages(filter: MessageFilter): Promise<Message[]> {
    const messages = await this.repository.getMessages(filter);

    // Sort by timestamp descending and apply limit
    const sorted = [...messages].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    if (filter.limit) {
      return sorted.slice(0, filter.limit);
    }

    return sorted;
  }

  async checkContextExists(participants: Participant[], type: ContextType): Promise<boolean> {
    const context = await this.repository.findContext({
      type,
      participants,
      includeExpired: false,
    });

    return context !== null;
  }
}
