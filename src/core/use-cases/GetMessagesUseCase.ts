import type { ConversationRepository } from '../ports/ConversationRepository.js';
import type { Message } from '../entities/Message.js';
import type { MessageFilter } from '../value-objects/Filters.js';

export class GetMessagesUseCase {
  constructor(private readonly repository: ConversationRepository) {}

  async execute(filter: MessageFilter): Promise<Message[]> {
    return await this.repository.getMessages(filter);
  }
}
