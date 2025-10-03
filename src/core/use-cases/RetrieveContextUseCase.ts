import type { ConversationRepository } from '../ports/ConversationRepository.js';
import type { ConversationHistory } from '../entities/ConversationHistory.js';
import type { ContextFilter } from '../value-objects/Filters.js';

export class RetrieveContextUseCase {
  constructor(private readonly repository: ConversationRepository) {}

  async execute(filter: ContextFilter): Promise<ConversationHistory> {
    return await this.repository.getConversationHistory(filter);
  }
}
