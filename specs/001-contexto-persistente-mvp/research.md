# Research: Contexto Persistente (MVP)

**Feature**: Conversation context persistence for AGI Force bot
**Date**: 2024-12-22
**Phase**: 0 - Technical Research

## Research Objectives

1. Validar integración Prisma + PostgreSQL en Node.js/TypeScript
2. Confirmar patrones de integración de contexto con Mastra
3. Investigar mejores prácticas de almacenamiento conversacional
4. Validar restricciones de performance para recuperación de contexto
5. Definir estrategia de pruebas automatizadas (Vitest + Spec Kit + contratos)

## Key Technical Decisions

### 1. Persistence Stack: Prisma + PostgreSQL / SQLite

**Decision**: Prisma ORM con PostgreSQL (CI/producción) y SQLite (desarrollo offline)
**Rationale**:

- Prisma provee tipos generados para TypeScript con estricto control de nullabilidad
- Soporte first-class para migraciones versionadas (`prisma migrate`) y generación de cliente
- Adaptadores equivalentes para PostgreSQL y SQLite, facilitando el cambio de entorno
- Permite middlewares y hooks para auditar operaciones críticas (ej. limpieza)

### 2. Schema Design

**Conversational Context**:

- Prisma modela `ConversationContext`, `ContextParticipant` y `ConversationMessage` (ver `data-model.md`)
- Uso de enumeraciones (`ContextType`) para garantizar valores válidos
- Índices para búsquedas frecuentes (`type`, `expiresAt`, `participant`, `contextId + timestamp`)
- Estrategia de `softDelete`: añadir `deletedAt` opcional en migración posterior para retención con gracia

### 3. Context Retrieval Strategy

**Decision**: Búsquedas orientadas a recencia y privacidad
**Implementation**:

- Recuperar últimos 50 mensajes por defecto (parámetro configurable en dominio)
- Filtrar por `participants` y `type` con consulta Prisma tipada
- Aplicar `orderBy: { timestamp: 'desc' }` y paginación basada en cursor
- Cache opcional de corta duración utilizando Mastra memory tools (evaluar tras MVP)

### 4. Data Retention Policy

**Decision**: Limpieza automatizada con retención de 30 días
**Implementation**:

- Job orquestado desde Mastra workflow o cron externo (6h)
- Notificación previa a través de Slack DM usando herramienta Mastra
- Soft delete (`deletedAt`) + eliminación dura tras 7 días de gracia
- Transacciones Prisma para asegurar consistencia entre mensajes y contexto

### 5. Testing & Tooling Strategy

**Decision**: Vitest como runner único + Spec Kit para escenarios Gherkin-like
**Implementation**:

- Contratos HTTP validados con AJV en pruebas Vitest
- Escenarios Spec Kit almacenados en `specs/001.../tests` y ejecutados vía `npm run spec:check`
- Testcontainers (evaluation) vs Docker Compose: preferible `docker compose up postgres` para CI; evaluar `@testcontainers/postgresql` si se requiere aislamiento adicional

## Technology Stack Validation

### Node.js + Prisma Integration

**Client**: Prisma Client (`@prisma/client`)
**Connection Pooling**: Gestionado por Prisma + driver subyacente
**Migration Strategy**: `prisma migrate dev` (local), `prisma migrate deploy` (CI/CD)
**Type Safety**: Generación automática de tipos para repositorio Postgres/SQLite

### Mastra Framework Integration

**Integration Points**:

- Context injection en agent responses vía Mastra tools
- Webhook integration para captura de mensajes
- Response enhancement con contexto histórico

### Performance Considerations

**Target Metrics**:

- Context retrieval: <500ms
- Message storage: <100ms
- Migraciones Prisma: <2 min en despliegue
- Auto-cleanup: Background, sin impacto en tiempo de respuesta

## Risk Assessment

### Low Risk

- PostgreSQL integration (tecnología probada)
- Basic CRUD operations (patrones conocidos)
- Schema design (requirements claros)

### Medium Risk

- Mastra integration complexity (documentación limitada)
- Context relevance algorithm (lógica de negocio compleja)
- Performance at scale (optimización requerida)

### High Risk

- Cross-platform context bleeding (security critical)
- Data consistency durante cleanup (transacciones complejas)

## Research Conclusions

### ✅ Viable Approaches

1. **Prisma + PostgreSQL**: Tipado robusto y migraciones declarativas
2. **Hexagonal architecture**: Separación clara entre core y adapters
3. **Soft delete + retención**: Respaldo para auditoría
4. **Scheduled cleanup**: Fiable mediante cron/Mastra workflow

### ⚠️ Areas Requiring Attention

1. **Mastra integration**: Requiere investigación adicional con Context7 MCP
2. **Sincronización Prisma ↔ Zod ↔ OpenAPI**: Documentar pipeline para evitar drift
3. **Performance monitoring**: Métricas desde día 1 (Pino + observabilidad)

### 🚫 Rejected Approaches

1. **NoSQL solutions**: Overkill para MVP, menos consistencia
2. **In-memory only**: No persistence, pérdida de contexto en restarts
3. **File-based storage**: No escalable, difficult backup/recovery

## Next Steps - Phase 1

1. Crear modelos de dominio y mapping Prisma
2. Actualizar contratos OpenAPI y esquemas Zod
3. Prototipar PostgresConversationRepository con Prisma Client
4. Ajustar casos de uso para persistencia real y retención
5. Configurar pruebas Vitest + Spec Kit contra base de datos real

## References

- [To be filled with Context7 MCP research results]
- Prisma ORM documentation
- PostgreSQL JSONB documentation
- Vitest & Spec Kit documentation
- Mastra framework integration patterns
