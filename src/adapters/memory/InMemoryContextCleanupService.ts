import type { ContextCleanupService } from '../../core/ports/ContextCleanupService.js';
import type { ConversationRepository } from '../../core/ports/ConversationRepository.js';
import type { ConversationContext, ContextId } from '../../core/entities/ConversationContext.js';

export class InMemoryContextCleanupService implements ContextCleanupService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly retentionDays: number = 30
  ) {}

  async findExpiredContexts(): Promise<ConversationContext[]> {
    const cutoffDate = new Date();
    return await this.repository.findExpiredContexts(cutoffDate);
  }

  async markForDeletion(contextId: ContextId): Promise<void> {
    // In memory implementation doesn't need marking
    // Production implementation would set a flag in database
  }

  async permanentDelete(contextId: ContextId): Promise<void> {
    await this.repository.deleteContext(contextId);
  }

  async notifyBeforeExpiration(context: ConversationContext): Promise<void> {
    // In memory implementation doesn't send notifications
    // Production implementation would send Slack notification
    console.log(`Context ${context.id} will be deleted soon`);
  }
}
