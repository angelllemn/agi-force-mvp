import type { ConversationContext, ContextId } from '../entities/ConversationContext.js';

export interface ContextCleanupService {
  findExpiredContexts(): Promise<ConversationContext[]>;
  markForDeletion(contextId: ContextId): Promise<void>;
  permanentDelete(contextId: ContextId): Promise<void>;
  notifyBeforeExpiration(context: ConversationContext): Promise<void>;
}
