import type { ConversationRepository } from '../ports/ConversationRepository.js';
import type { ConversationContext, ContextType, Participant } from '../entities/ConversationContext.js';
import { ContextAlreadyExistsError } from '../errors/ContextErrors.js';

export class CreateContextUseCase {
  constructor(private readonly repository: ConversationRepository) {}

  async execute(type: ContextType, participants: Participant[]): Promise<ConversationContext> {
    // Check if context already exists
    const existing = await this.repository.findContext({
      type,
      participants,
      includeExpired: false,
    });

    if (existing) {
      throw new ContextAlreadyExistsError(
        `Context already exists for participants: ${participants.join(', ')}`
      );
    }

    // Create new context
    return await this.repository.createContext(type, participants);
  }
}
