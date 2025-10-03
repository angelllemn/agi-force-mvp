import type { ContextId, ContextType, Participant } from '../entities/ConversationContext.js';

export interface ContextFilter {
  readonly type?: ContextType;
  readonly participants: Participant[];
  readonly since?: Date;
  readonly limit?: number;
  readonly includeExpired?: boolean;
}

export interface MessageFilter {
  readonly contextId: ContextId;
  readonly since?: Date;
  readonly until?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

export class ContextFilterVO implements ContextFilter {
  readonly type?: ContextType;
  readonly participants: Participant[];
  readonly since?: Date;
  readonly limit?: number;
  readonly includeExpired?: boolean;

  constructor(data: ContextFilter) {
    this.type = data.type;
    this.participants = [...data.participants];
    this.since = data.since;
    this.limit = data.limit;
    this.includeExpired = data.includeExpired ?? false;
  }

  static create(data: ContextFilter): ContextFilterVO {
    if (!data.participants || data.participants.length === 0) {
      throw new Error('ContextFilter must have at least one participant');
    }
    return new ContextFilterVO(data);
  }
}

export class MessageFilterVO implements MessageFilter {
  readonly contextId: ContextId;
  readonly since?: Date;
  readonly until?: Date;
  readonly limit?: number;
  readonly offset?: number;

  constructor(data: MessageFilter) {
    this.contextId = data.contextId;
    this.since = data.since;
    this.until = data.until;
    this.limit = data.limit;
    this.offset = data.offset;
  }

  static create(data: MessageFilter): MessageFilterVO {
    if (!data.contextId) {
      throw new Error('MessageFilter must have a contextId');
    }
    return new MessageFilterVO(data);
  }
}
