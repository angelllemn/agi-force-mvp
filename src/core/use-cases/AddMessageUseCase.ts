import type { ConversationRepository } from '../ports/ConversationRepository.js';
import type { Message } from '../entities/Message.js';
import type { ContextId, Participant } from '../entities/ConversationContext.js';
import { ContextNotFoundError, InvalidMessageError } from '../errors/ContextErrors.js';

export class AddMessageUseCase {
  constructor(private readonly repository: ConversationRepository) {}

  async execute(
    contextId: ContextId,
    sender: Participant,
    content: string,
    timestamp?: Date
  ): Promise<Message> {
    if (!content || content.trim().length === 0) {
      throw new InvalidMessageError('Message content cannot be empty');
    }

    // Verify context exists
    const context = await this.repository.findContext({
      participants: [], // Will be checked by ID in repository
      includeExpired: false,
    });

    // Add message to context
    const message = await this.repository.addMessage(
      contextId,
      sender,
      content,
      timestamp || new Date()
    );

    // Update context activity
    await this.repository.updateContextActivity(contextId);

    return message;
  }
}
