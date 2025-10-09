# Data Model: Contexto Persistente

**Feature**: Conversation context persistence
**Date**: 2024-12-22
**Phase**: 1 - Design

## Core Domain Entities

### ConversationContext

**Descripción**: Entidad principal que representa el contexto de una conversación

```typescript
interface ConversationContext {
  readonly id: ContextId;
  readonly type: ContextType;
  readonly participants: Participant[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date;
}

type ContextType = "user" | "group";
type ContextId = string; // UUID
type Participant = string; // Slack user ID or channel ID
```

### Message

**Descripción**: Mensaje individual dentro de un contexto conversacional

```typescript
interface Message {
  readonly id: MessageId;
  readonly contextId: ContextId;
  readonly sender: Participant;
  readonly content: string;
  readonly timestamp: Date;
  readonly createdAt: Date;
}

type MessageId = string; // UUID
```

### ConversationHistory

**Descripción**: Agregado que contiene contexto completo con mensajes

```typescript
interface ConversationHistory {
  readonly context: ConversationContext;
  readonly messages: Message[];
  readonly messageCount: number;
  readonly lastActivity: Date;
}
```

## Value Objects

### ContextFilter

**Descripción**: Criterios para filtrar y recuperar contexto

```typescript
interface ContextFilter {
  readonly type?: ContextType;
  readonly participants: Participant[];
  readonly since?: Date;
  readonly limit?: number;
  readonly includeExpired?: boolean;
}
```

### MessageFilter

**Descripción**: Criterios para filtrar mensajes dentro de un contexto

```typescript
interface MessageFilter {
  readonly contextId: ContextId;
  readonly since?: Date;
  readonly until?: Date;
  readonly limit?: number;
  readonly offset?: number;
}
```

## Domain Services

### ContextRetrieval

**Descripción**: Servicio para recuperar contexto relevante

```typescript
interface ContextRetrievalService {
  findRelevantContext(filter: ContextFilter): Promise<ConversationHistory[]>;
  getLatestMessages(filter: MessageFilter): Promise<Message[]>;
  checkContextExists(
    participants: Participant[],
    type: ContextType
  ): Promise<boolean>;
}
```

### ContextCleanup

**Descripción**: Servicio para gestión del ciclo de vida del contexto

```typescript
interface ContextCleanupService {
  findExpiredContexts(): Promise<ConversationContext[]>;
  markForDeletion(contextId: ContextId): Promise<void>;
  permanentDelete(contextId: ContextId): Promise<void>;
  notifyBeforeExpiration(context: ConversationContext): Promise<void>;
}
```

## Repository Interfaces (Ports)

### ConversationRepository

**Descripción**: Puerto principal para persistencia de conversaciones

```typescript
interface ConversationRepository {
  // Context management
  createContext(
    type: ContextType,
    participants: Participant[]
  ): Promise<ConversationContext>;
  findContext(filter: ContextFilter): Promise<ConversationContext | null>;
  updateContextActivity(contextId: ContextId): Promise<void>;
  extendExpiration(contextId: ContextId, expiresAt: Date): Promise<void>;

  // Message management
  addMessage(
    contextId: ContextId,
    sender: Participant,
    content: string,
    timestamp: Date
  ): Promise<Message>;
  getMessages(filter: MessageFilter): Promise<Message[]>;

  // History retrieval
  getConversationHistory(
    filter: ContextFilter
  ): Promise<ConversationHistory | null>;

  // Cleanup operations
  findExpiredContexts(cutoffDate: Date): Promise<ConversationContext[]>;
  deleteContext(contextId: ContextId): Promise<void>;
}
```

## Prisma Schema Representation

```prisma
model ConversationContext {
  id           String    @id @default(uuid())
  type         ContextType
  participants String[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  expiresAt    DateTime
  histories    ConversationMessage[]

  @@index([type, participants])
  @@index([expiresAt])
}

model ConversationMessage {
  id        String   @id @default(uuid())
  contextId String
  sender    String
  content   String
  timestamp DateTime
  createdAt DateTime @default(now())

  context ConversationContext @relation(fields: [contextId], references: [id], onDelete: Cascade)

  @@index([contextId, timestamp])
}

enum ContextType {
  user
  group
}
```

**Notas**:

- A nivel de dominio, `participants` es un arreglo; en persistencia se normaliza mediante la tabla `ContextParticipant` para compatibilidad con PostgreSQL y SQLite.
- `expiresAt` se calcula en dominio (30 días) y se persiste como `DateTime` para permitir consultas directas.
- Se requiere `prisma generate` para mantener tipos `Prisma.ConversationContext` alineados con el dominio.

## Domain Events

### ContextCreated

```typescript
interface ContextCreated {
  readonly eventType: "ContextCreated";
  readonly contextId: ContextId;
  readonly type: ContextType;
  readonly participants: Participant[];
  readonly timestamp: Date;
}
```

### MessageAdded

```typescript
interface MessageAdded {
  readonly eventType: "MessageAdded";
  readonly contextId: ContextId;
  readonly messageId: MessageId;
  readonly sender: Participant;
  readonly timestamp: Date;
}
```

### ContextExpired

```typescript
interface ContextExpired {
  readonly eventType: "ContextExpired";
  readonly contextId: ContextId;
  readonly expirationDate: Date;
  readonly notificationSent: boolean;
}
```

## Domain Errors

### ConversationErrors

```typescript
// Core domain errors
class ContextNotFoundError extends Error {
  constructor(public readonly filter: ContextFilter) {
    super(`Context not found for filter: ${JSON.stringify(filter)}`);
  }
}

class InvalidParticipantsError extends Error {
  constructor(public readonly participants: Participant[]) {
    super(`Invalid participants: ${participants.join(", ")}`);
  }
}

class ContextExpiredError extends Error {
  constructor(
    public readonly contextId: ContextId,
    public readonly expirationDate: Date
  ) {
    super(`Context ${contextId} expired on ${expirationDate.toISOString()}`);
  }
}

class MessageTooLongError extends Error {
  constructor(
    public readonly contentLength: number,
    public readonly maxLength: number
  ) {
    super(`Message too long: ${contentLength} chars, max: ${maxLength}`);
  }
}
```

## Business Rules

### Context Creation Rules

1. **Unique context per participant set**: No duplicate contexts for same participants and type
2. **Participant validation**: All participants must be valid Slack IDs
3. **Type enforcement**: Context type must be 'user' (single participant) or 'group' (multiple)
4. **Expiration policy**: All contexts expire 30 days from last activity

### Message Rules

1. **Content limits**: Messages limited to 4000 characters (Slack limit)
2. **Timestamp validation**: Message timestamp cannot be in the future
3. **Sender validation**: Sender must be one of the context participants
4. **Ordering**: Messages ordered by timestamp within context

### Retrieval Rules

1. **Privacy enforcement**: Users can only access contexts they participate in
2. **Default limits**: Default to 50 most recent messages if no limit specified
3. **Performance bounds**: Maximum 500 messages per retrieval request
4. **Relevance scoring**: Recent messages (24h) have higher relevance

### Cleanup Rules

1. **Grace period**: 7-day grace period after expiration before permanent deletion
2. **Notification policy**: Notify participants 7 days before expiration
3. **Batch processing**: Cleanup operations performed in batches of 100
4. **Audit trail**: Log all deletion operations for compliance

## Persistence Considerations

- **Transactions**: Inserción de mensaje y actualización de `updatedAt`/`expiresAt` deben ocurrir en la misma transacción.
- **Soft vs Hard delete**: Usar borrado lógico (`deletedAt`) para periodo de gracia, seguido de eliminación dura.
- **SQLite Compatibility**: En modo desarrollo, Prisma serializa arrays en JSON; ajustar repositorio para normalizar datos antes de exponerlos al dominio.

## Validation & Zod Contracts

- `ConversationContextSchema`: valida `type`, `participants` (no vacío), fechas consistentes (`expiresAt` >= `updatedAt`).
- `MessageSchema`: aplica límite de 4000 caracteres y formato ISO para timestamps.
- `ConversationHistorySchema`: asegura orden descendente por `timestamp` y límites de página.

## Data Constraints

### Database Constraints

```sql
-- Context constraints
ALTER TABLE conversation_contexts
ADD CONSTRAINT check_context_type CHECK (context_type IN ('user', 'group'));

ALTER TABLE conversation_contexts
ADD CONSTRAINT check_participants_not_empty CHECK (array_length(participants, 1) > 0);

ALTER TABLE conversation_contexts
ADD CONSTRAINT check_user_single_participant
CHECK (context_type != 'user' OR array_length(participants, 1) = 1);

ALTER TABLE conversation_contexts
ADD CONSTRAINT check_group_multiple_participants
CHECK (context_type != 'group' OR array_length(participants, 1) > 1);

-- Message constraints
ALTER TABLE conversation_messages
ADD CONSTRAINT check_content_not_empty CHECK (LENGTH(content) > 0);

ALTER TABLE conversation_messages
ADD CONSTRAINT check_content_max_length CHECK (LENGTH(content) <= 4000);

ALTER TABLE conversation_messages
ADD CONSTRAINT check_timestamp_not_future CHECK (timestamp <= NOW());
```

## Migration Strategy

### Phase 1: Core Schema

1. Create basic tables with constraints
2. Add essential indexes for performance
3. Setup foreign key relationships

### Phase 2: Optimization

1. Add specialized indexes based on query patterns
2. Implement partitioning for large datasets
3. Add database-level cleanup procedures

### Phase 3: Advanced Features

1. Full-text search capabilities
2. Context relevance scoring
3. Advanced analytics and reporting
