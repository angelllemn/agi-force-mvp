import type { ContextType } from '../../core/entities/ConversationContext.js';
import { ContextAlreadyExistsError } from '../../core/errors/ContextErrors.js';
import type { ConversationRepository } from '../../core/ports/ConversationRepository.js';
import { AddMessageUseCase } from '../../core/use-cases/AddMessageUseCase.js';
import { CreateContextUseCase } from '../../core/use-cases/CreateContextUseCase.js';
import { RetrieveContextUseCase } from '../../core/use-cases/RetrieveContextUseCase.js';

export interface SlackMessage {
  user: string;
  text: string;
  channel: string;
  channelType: 'im' | 'channel' | 'group';
  ts: string; // Slack timestamp
}

export class SlackContextIntegration {
  private createContextUseCase: CreateContextUseCase;
  private addMessageUseCase: AddMessageUseCase;
  private retrieveContextUseCase: RetrieveContextUseCase;

  constructor(private readonly repository: ConversationRepository) {
    this.createContextUseCase = new CreateContextUseCase(repository);
    this.addMessageUseCase = new AddMessageUseCase(repository);
    this.retrieveContextUseCase = new RetrieveContextUseCase(repository);
  }

  /**
   * Process incoming Slack message and maintain context
   */
  async processMessage(message: SlackMessage): Promise<string[]> {
    const contextType: ContextType = message.channelType === 'im' ? 'user' : 'group';
    const participants = contextType === 'user' ? [message.user] : [message.channel];

    // Get or create context
    let context;
    try {
      const history = await this.retrieveContextUseCase.execute({
        type: contextType,
        participants,
      });
      context = history.context;
    } catch (error) {
      // Context doesn't exist, create it
      try {
        context = await this.createContextUseCase.execute(contextType, participants);
      } catch (err) {
        if (err instanceof ContextAlreadyExistsError) {
          // Race condition: context was created by another request
          const history = await this.retrieveContextUseCase.execute({
            type: contextType,
            participants,
          });
          context = history.context;
        } else {
          throw err;
        }
      }
    }

    // Add message to context
    const timestamp = new Date(parseFloat(message.ts) * 1000);
    await this.addMessageUseCase.execute(
      context.id,
      message.user,
      message.text,
      timestamp
    );

    // Retrieve conversation history for bot response
    const history = await this.retrieveContextUseCase.execute({
      type: contextType,
      participants,
      limit: 50, // Last 50 messages for context
    });

    // Return recent message contents for context
    return history.messages.map(m => `${m.sender}: ${m.content}`);
  }

  /**
   * Add bot response to context
   */
  async addBotResponse(
    channel: string,
    channelType: 'im' | 'channel' | 'group',
    user: string,
    response: string
  ): Promise<void> {
    const contextType: ContextType = channelType === 'im' ? 'user' : 'group';
    const participants = contextType === 'user' ? [user] : [channel];

    const history = await this.retrieveContextUseCase.execute({
      type: contextType,
      participants,
    });

    await this.addMessageUseCase.execute(
      history.context.id,
      'BOT',
      response,
      new Date()
    );
  }

  /**
   * Get conversation context for a user or channel
   */
  async getContext(
    identifier: string,
    type: ContextType
  ): Promise<string[]> {
    const history = await this.retrieveContextUseCase.execute({
      type,
      participants: [identifier],
      limit: 50,
    });

    return history.messages.map(m => `${m.sender}: ${m.content}`);
  }

  /**
   * Check if context exists for user or channel
   */
  async hasContext(identifier: string, type: ContextType): Promise<boolean> {
    try {
      await this.retrieveContextUseCase.execute({
        type,
        participants: [identifier],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
