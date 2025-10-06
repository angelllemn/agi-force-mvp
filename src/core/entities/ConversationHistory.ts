import type { ConversationContext } from './ConversationContext.js';
import type { Message } from './Message.js';

export interface ConversationHistory {
  readonly context: ConversationContext;
  readonly messages: Message[];
  readonly messageCount: number;
  readonly lastActivity: Date;
}

export class ConversationHistoryAggregate implements ConversationHistory {
  readonly context: ConversationContext;
  readonly messages: Message[];
  readonly messageCount: number;
  readonly lastActivity: Date;

  constructor(context: ConversationContext, messages: Message[]) {
    this.context = context;
    this.messages = [...messages];
    this.messageCount = messages.length;
    this.lastActivity = messages.length > 0
      ? messages[messages.length - 1].timestamp
      : context.updatedAt;
  }

  static create(context: ConversationContext, messages: Message[]): ConversationHistoryAggregate {
    return new ConversationHistoryAggregate(context, messages);
  }
}
