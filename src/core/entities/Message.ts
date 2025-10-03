import type { ContextId, Participant } from './ConversationContext.js';

export type MessageId = string; // UUID

export interface Message {
  readonly id: MessageId;
  readonly contextId: ContextId;
  readonly sender: Participant;
  readonly content: string;
  readonly timestamp: Date;
  readonly createdAt: Date;
}

export class MessageEntity implements Message {
  readonly id: MessageId;
  readonly contextId: ContextId;
  readonly sender: Participant;
  readonly content: string;
  readonly timestamp: Date;
  readonly createdAt: Date;

  private constructor(data: Message) {
    this.id = data.id;
    this.contextId = data.contextId;
    this.sender = data.sender;
    this.content = data.content;
    this.timestamp = data.timestamp;
    this.createdAt = data.createdAt;
  }

  static create(
    id: MessageId,
    contextId: ContextId,
    sender: Participant,
    content: string,
    timestamp?: Date
  ): MessageEntity {
    const now = new Date();
    return new MessageEntity({
      id,
      contextId,
      sender,
      content,
      timestamp: timestamp || now,
      createdAt: now,
    });
  }

  static fromData(data: Message): MessageEntity {
    return new MessageEntity(data);
  }
}
