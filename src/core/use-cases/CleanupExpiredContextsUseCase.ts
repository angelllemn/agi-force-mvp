import type { ConversationRepository } from '../ports/ConversationRepository.js';
import type { ContextCleanupService } from '../ports/ContextCleanupService.js';

export class CleanupExpiredContextsUseCase {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly cleanupService: ContextCleanupService
  ) {}

  async execute(): Promise<number> {
    const expiredContexts = await this.cleanupService.findExpiredContexts();
    
    let deletedCount = 0;
    for (const context of expiredContexts) {
      try {
        // Notify before deletion (if needed)
        await this.cleanupService.notifyBeforeExpiration(context);
        
        // Delete context
        await this.cleanupService.permanentDelete(context.id);
        deletedCount++;
      } catch (error) {
        // Log error but continue with other contexts
        console.error(`Failed to delete context ${context.id}:`, error);
      }
    }

    return deletedCount;
  }
}
