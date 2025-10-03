import type { ConversationRepository } from '../ports/ConversationRepository.js';
import type { ContextId } from '../entities/ConversationContext.js';
import { ContextNotFoundError } from '../errors/ContextErrors.js';

export class DeleteContextUseCase {
  constructor(private readonly repository: ConversationRepository) {}

  async execute(contextId: ContextId): Promise<void> {
    await this.repository.deleteContext(contextId);
  }
}
