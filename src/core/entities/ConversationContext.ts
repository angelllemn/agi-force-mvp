export type ContextType = 'user' | 'group';
export type ContextId = string; // UUID
export type Participant = string; // Slack user ID or channel ID

export interface ConversationContext {
  readonly id: ContextId;
  readonly type: ContextType;
  readonly participants: Participant[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date;
}

export class ConversationContextEntity implements ConversationContext {
  readonly id: ContextId;
  readonly type: ContextType;
  readonly participants: Participant[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date;

  private constructor(data: ConversationContext) {
    this.id = data.id;
    this.type = data.type;
    this.participants = [...data.participants];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.expiresAt = data.expiresAt;
  }

  static create(
    id: ContextId,
    type: ContextType,
    participants: Participant[],
    retentionDays: number = 30
  ): ConversationContextEntity {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    return new ConversationContextEntity({
      id,
      type,
      participants: [...participants],
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });
  }

  static fromData(data: ConversationContext): ConversationContextEntity {
    return new ConversationContextEntity(data);
  }

  updateActivity(): ConversationContextEntity {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    return new ConversationContextEntity({
      ...this,
      updatedAt: now,
      expiresAt,
    });
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
