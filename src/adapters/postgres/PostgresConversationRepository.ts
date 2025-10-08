import type { Prisma, ContextParticipant as PrismaContextParticipant, ConversationContext as PrismaConversationContext, ConversationMessage as PrismaConversationMessage } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { ContextId, ContextType, ConversationContext, Participant } from '../../core/entities/ConversationContext.js';
import { ConversationContextEntity } from '../../core/entities/ConversationContext.js';
import type { ConversationHistory } from '../../core/entities/ConversationHistory.js';
import { ConversationHistoryAggregate } from '../../core/entities/ConversationHistory.js';
import type { Message } from '../../core/entities/Message.js';
import { MessageEntity } from '../../core/entities/Message.js';
import { ContextNotFoundError } from '../../core/errors/ContextErrors.js';
import type { ConversationRepository } from '../../core/ports/ConversationRepository.js';
import type { ContextFilter, MessageFilter } from '../../core/value-objects/Filters.js';
import { getPrismaClient } from '../../infra/persistence/prismaClient.js';

const RETENTION_DAYS = 30;

type ContextWithParticipants = PrismaConversationContext & {
  participants: PrismaContextParticipant[];
};

type MessageRecord = PrismaConversationMessage;

export class PostgresConversationRepository implements ConversationRepository {
  private readonly prisma = getPrismaClient();

  async createContext(type: ContextType, participants: Participant[]): Promise<ConversationContext> {
    const now = new Date();
    const expiresAt = this.calculateExpiration(now);

    const context = await this.prisma.$transaction(async (tx) => {
      const created = await tx.conversationContext.create({
        data: {
          id: randomUUID(),
          type,
          expiresAt,
        },
      });

      if (participants.length > 0) {
        await tx.contextParticipant.createMany({
          data: participants.map((participant) => ({
            contextId: created.id,
            participant,
          })),
        });
      }

      return tx.conversationContext.findUniqueOrThrow({
        where: { id: created.id },
        include: { participants: true },
      });
    });

    return this.mapContext(context);
  }

  async findContext(filter: ContextFilter): Promise<ConversationContext | null> {
    const where: Prisma.ConversationContextWhereInput = {
      deletedAt: null,
    };

    if (filter.type) {
      where.type = filter.type;
    }

    if (!filter.includeExpired) {
      where.expiresAt = { gt: new Date() };
    }

    if (filter.since) {
      where.createdAt = { gte: filter.since };
    }

    const contexts = await this.prisma.conversationContext.findMany({
      where,
      include: { participants: true },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const targetParticipants = this.normalizeParticipants(filter.participants ?? []);

    const matching = filter.participants && filter.participants.length > 0
      ? contexts.find((context) => this.matchesParticipants(context.participants, targetParticipants))
      : contexts[0];

    return matching ? this.mapContext(matching) : null;
  }

  async updateContextActivity(contextId: ContextId): Promise<void> {
    const context = await this.prisma.conversationContext.findUnique({
      where: { id: contextId },
      select: { id: true },
    });

    if (!context) {
      throw new ContextNotFoundError(`Context not found: ${contextId}`);
    }

    await this.prisma.conversationContext.update({
      where: { id: contextId },
      data: {
        expiresAt: this.calculateExpiration(),
      },
    });
  }

  async addMessage(
    contextId: ContextId,
    sender: Participant,
    content: string,
    timestamp: Date
  ): Promise<Message> {
    await this.ensureContextExists(contextId);

    const message = await this.prisma.conversationMessage.create({
      data: {
        id: randomUUID(),
        contextId,
        sender,
        content,
        timestamp,
      },
    });

    return this.mapMessage(message);
  }

  async getMessages(filter: MessageFilter): Promise<Message[]> {
    const where: Prisma.ConversationMessageWhereInput = {
      contextId: filter.contextId,
    };

    if (filter.since || filter.until) {
      where.timestamp = {};
      if (filter.since) {
        where.timestamp.gte = filter.since;
      }
      if (filter.until) {
        where.timestamp.lte = filter.until;
      }
    }

    const results = await this.prisma.conversationMessage.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      skip: filter.offset ?? undefined,
      take: filter.limit ?? undefined,
    });

    return results.map((record) => this.mapMessage(record));
  }

  async getConversationHistory(filter: ContextFilter): Promise<ConversationHistory> {
    const context = await this.findContext(filter);
    if (!context) {
      throw new ContextNotFoundError('Context not found for provided filter');
    }

    const messages = await this.getMessages({
      contextId: context.id,
      limit: filter.limit,
    });

    return ConversationHistoryAggregate.create(context, messages);
  }

  async findExpiredContexts(cutoffDate: Date): Promise<ConversationContext[]> {
    const contexts = await this.prisma.conversationContext.findMany({
      where: {
        expiresAt: { lt: cutoffDate },
        deletedAt: null,
      },
      include: { participants: true },
    });

    return contexts.map((context) => this.mapContext(context));
  }

  async deleteContext(contextId: ContextId): Promise<void> {
    await this.ensureContextExists(contextId);

    await this.prisma.$transaction([
      this.prisma.contextParticipant.deleteMany({ where: { contextId } }),
      this.prisma.conversationMessage.deleteMany({ where: { contextId } }),
      this.prisma.conversationContext.delete({ where: { id: contextId } }),
    ]);
  }

  private async ensureContextExists(contextId: ContextId): Promise<void> {
    const exists = await this.prisma.conversationContext.findUnique({
      where: { id: contextId },
      select: { id: true },
    });

    if (!exists) {
      throw new ContextNotFoundError(`Context not found: ${contextId}`);
    }
  }

  private mapContext(context: ContextWithParticipants): ConversationContext {
    return ConversationContextEntity.fromData({
      id: context.id,
      type: context.type,
      participants: context.participants
        .map((participant) => participant.participant)
        .sort(),
      createdAt: context.createdAt,
      updatedAt: context.updatedAt,
      expiresAt: context.expiresAt,
    });
  }

  private mapMessage(record: MessageRecord): Message {
    return MessageEntity.fromData({
      id: record.id,
      contextId: record.contextId,
      sender: record.sender,
      content: record.content,
      timestamp: record.timestamp,
      createdAt: record.createdAt,
    });
  }

  private matchesParticipants(
    participants: PrismaContextParticipant[],
    expected: string[]
  ): boolean {
    const actual = this.normalizeParticipants(
      participants.map((participant) => participant.participant)
    );

    if (actual.length !== expected.length) {
      return false;
    }

    return actual.every((value, index) => value === expected[index]);
  }

  private normalizeParticipants(participants: readonly string[]): string[] {
    return [...participants].sort();
  }

  private calculateExpiration(from: Date = new Date(), days = RETENTION_DAYS): Date {
    const date = new Date(from);
    date.setDate(date.getDate() + days);
    return date;
  }
}
