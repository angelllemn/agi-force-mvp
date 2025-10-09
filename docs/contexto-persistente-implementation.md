# Contexto Persistente (MVP) - Implementation

This document resume el estado actual y el plan de evolución hacia persistencia real para el bot AGI Force.

## Estado Actual (Prisma/PostgreSQL en progreso)

- Repositorio Prisma (`src/adapters/postgres/PostgresConversationRepository.ts`) disponible para utilizar PostgreSQL/SQLite.
- Repositorios en memoria (`src/adapters/memory/*`) usados por los casos de uso actuales mientras se completa la transición.
- Cobertura de pruebas que valida comportamiento del dominio sin tocar almacenamiento real.
- Documentación y contratos generados durante la fase de especificación.

> **Limitación**: Aún falta reemplazar wiring y pruebas para que todos los flujos utilicen el repositorio Prisma en lugar del adaptador en memoria.

## Architecture

The implementation follows hexagonal (clean) architecture:

```
src/
├── core/                           # Business logic (no external dependencies)
│   ├── entities/                   # Domain entities
│   │   ├── ConversationContext.ts  # Context entity with 30-day retention
│   │   ├── Message.ts              # Message entity
│   │   └── ConversationHistory.ts  # Aggregate of context + messages
│   ├── value-objects/              # Value objects
│   │   └── Filters.ts              # ContextFilter, MessageFilter
│   ├── errors/                     # Domain errors
│   │   └── ContextErrors.ts        # Custom error types
│   ├── ports/                      # Interface definitions
│   │   ├── ConversationRepository.ts
│   │   ├── ContextRetrievalService.ts
│   │   └── ContextCleanupService.ts
│   └── use-cases/                  # Business logic
│       ├── CreateContextUseCase.ts
│       ├── AddMessageUseCase.ts
│       ├── RetrieveContextUseCase.ts
│       ├── GetMessagesUseCase.ts
│       ├── DeleteContextUseCase.ts
│       └── CleanupExpiredContextsUseCase.ts
│
└── adapters/                       # External integrations
    ├── memory/                     # In-memory implementations (for tests)
    │   ├── InMemoryConversationRepository.ts
    │   ├── InMemoryContextCleanupService.ts
    │   └── InMemoryContextRetrievalService.ts
  └── slack/                      # Slack integration
    └── SlackContextIntegration.ts
└── infra/
  ├── config/
  │   └── env.ts                  # Validation de variables de entorno
  └── mastra/                     # Integraciones con Mastra
```

## Evolución Hacia Persistencia Real

### Integración Prisma + PostgreSQL

- Añadir `prisma/schema.prisma` con modelos `ConversationContext` y `ConversationMessage`.
- Generar cliente tipado (`npx prisma generate`) y adaptador `PostgresConversationRepository` que implementa `ConversationRepository`.
- Ejecutar migraciones versionadas (`npx prisma migrate dev`) apuntando a PostgreSQL en CI y producción; usar SQLite para desarrollo local.
- Normalizar participantes en tabla dedicada (`ContextParticipant`) para compatibilidad entre motores.

### Sincronización de Contratos

- Actualizar esquemas Zod y OpenAPI para reflejar cualquier cambio de payload/persistencia.
- Alinear Spec Kit (escenarios DM/canal) con base de datos real para validar separación de contextos.

### Observabilidad

- Incorporar Pino con metadatos (`contextId`, `participants`) para trazas y auditoría.
- Registrar métricas básicas (tiempo de lectura/escritura, tamaño de contexto) para garantizar NFR.

## Key Features Objetivo

### 1. Separate Contexts

- **User DM**: Each user has their own private context
- **Group Channels**: Each channel has its own shared context
- **Isolation**: Contexts are completely separate, preventing cross-contamination

### 2. 30-Day Retention

- Conversations expire 30 days after last activity
- Expiration is automatically extended when new messages are added
- Cleanup service can periodically remove expired contexts

### 3. Context Retrieval

- Full conversation history available for context-aware responses
- Messages include sender, content, and timestamp
- Supports filtering by date, limit, and pagination

## Usage Examples (post-integration)

### Basic Usage with Slack

```typescript
import { InMemoryConversationRepository } from "./adapters/memory/InMemoryConversationRepository.js";
import { SlackContextIntegration } from "./adapters/slack/SlackContextIntegration.js";

// Initialize
const repository = new PostgresConversationRepository(prismaClient);
const slackIntegration = new SlackContextIntegration(repository);

// Process incoming Slack message
const message = {
  user: "U12345",
  text: "Hello bot!",
  channel: "D12345",
  channelType: "im",
  ts: "1234567890.000000",
};

const context = await slackIntegration.processMessage(message);
// context contains array of previous messages for context

// Add bot response
await slackIntegration.addBotResponse(
  "D12345",
  "im",
  "U12345",
  "Hello! How can I help you?"
);
```

### Direct Use Case Usage

```typescript
import { InMemoryConversationRepository } from "./adapters/memory/InMemoryConversationRepository.js";
import { CreateContextUseCase } from "./core/use-cases/CreateContextUseCase.js";
import { AddMessageUseCase } from "./core/use-cases/AddMessageUseCase.js";
import { RetrieveContextUseCase } from "./core/use-cases/RetrieveContextUseCase.js";

const repository = new PostgresConversationRepository(prismaClient);

// Create context
const createUseCase = new CreateContextUseCase(repository);
const context = await createUseCase.execute("user", ["U12345"]);

// Add message
const addMessageUseCase = new AddMessageUseCase(repository);
await addMessageUseCase.execute(
  context.id,
  "U12345",
  "What is Node.js?",
  new Date()
);

// Retrieve history
const retrieveUseCase = new RetrieveContextUseCase(repository);
const history = await retrieveUseCase.execute({
  type: "user",
  participants: ["U12345"],
  limit: 50,
});

console.log(`Found ${history.messageCount} messages`);
history.messages.forEach((msg) => {
  console.log(`${msg.sender}: ${msg.content}`);
});
```

## Functional Requirements Coverage Plan

| ID     | Requirement                                          | Status                                       |
| ------ | ---------------------------------------------------- | -------------------------------------------- |
| FR-001 | Separate conversation history for each user in DMs   | ✅                                           |
| FR-002 | Separate conversation history for each group/channel | ✅                                           |
| FR-003 | Persist context across bot restarts and sessions     | 🔄 Prisma repository listo; wiring pendiente |
| FR-004 | Retrieve relevant conversation context               | ✅                                           |
| FR-005 | Distinguish user context from group context          | ✅                                           |
| FR-006 | Store message content, timestamps, and participants  | ✅                                           |
| FR-007 | Limit context retrieval to avoid performance issues  | ✅                                           |
| FR-008 | Handle new users/groups without prior context        | ✅                                           |
| FR-009 | Maintain continuity across sessions                  | ✅                                           |
| FR-010 | Group context only accessible within group           | ✅                                           |
| FR-011 | User DM context only accessible in DMs               | ✅                                           |
| FR-014 | Retain conversation history for 30 days              | 🔄 Validar con limpieza programada           |
| FR-016 | Completely separate contexts per group               | ✅                                           |
| FR-017 | Store only message text and timestamps (MVP)         | ✅                                           |

## Testing Roadmap

```bash
npm test                # Vitest (unit + integration)
npm run spec:check      # Escenarios Spec Kit
```

**Planes de validación**:

- Ejecutar suites de integración contra PostgreSQL (docker compose) y contra SQLite (modo offline) para asegurar paridad.
- Añadir pruebas de contrato que validen respuestas HTTP contra `openapi/context-api.yaml` mediante AJV.
- Documentar tiempos de ejecución para garantizar NFR (<500ms recuperación).

> Las suites de Vitest que interactúan con Prisma ya levantan automáticamente un contenedor efímero de PostgreSQL mediante Testcontainers. Requieren Docker disponible durante la ejecución.

## Next Steps (Production)

To make this production-ready:

1. **PostgreSQL Implementation**

- Reemplazar InMemoryConversationRepository por PostgresConversationRepository (Prisma)
- Crear `schema.prisma` y migraciones (ver `specs/001-contexto-persistente-mvp/data-model.md`)
- Añadir control de transacciones y manejo de reconexión

2. **HTTP API Layer**

   - Implement REST endpoints from OpenAPI spec
   - Add request validation middleware
   - Add error handling middleware

3. **Production Cleanup Service**

   - Add scheduled job for expired context cleanup
   - Implement user notifications before deletion
   - Add logging and monitoring

4. **Performance Optimizations**

   - Add caching layer (Redis)
   - Implement pagination for large histories
   - Add database indexes
   - Target: <500ms context retrieval

5. **Deployment**

- Docker container configuration
- Environment variable setup (`DATABASE_URL`, `PRISMA_LOGS`)
- Base de datos migrada en pipeline CI/CD (`prisma migrate deploy`)
- Health check endpoints

## Configuration

The system requires minimal configuration:

```env
# Driver de persistencia soportado: memory | postgres | sqlite
PERSISTENCE_DRIVER=postgres

# Base de datos (PostgreSQL por defecto)
DATABASE_URL=postgresql://agi_user:agi_pass@localhost:5432/agi_force_mvp

# Alternativa SQLite (desarrollo offline)
# PERSISTENCE_DRIVER=sqlite
# DATABASE_URL=file:./data/context.db

# URL específica para pruebas automatizadas (opcional)
# TEST_DATABASE_URL=postgresql://agi_test:agi_test@localhost:5433/agi_force_mvp_test

# Retention policy (days)
CONTEXT_RETENTION_DAYS=30

# Cleanup schedule (cron format)
CLEANUP_SCHEDULE="0 */6 * * *"  # Cada 6 horas
```

Se recomienda mantener archivos dedicados por perfil (`.env`, `.env.local`, `.env.test`). El cargador incorporado respeta ese orden de prioridad sin sobrescribir variables ya definidas por el sistema.

## License

Part of AGI Force MVP project.
