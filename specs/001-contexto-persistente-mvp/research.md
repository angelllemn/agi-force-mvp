# Research: Contexto Persistente (MVP)

**Feature**: Conversation context persistence for AGI Force bot
**Date**: 2024-12-22
**Phase**: 0 - Technical Research

## Research Objectives
1. Validate PostgreSQL integration with Node.js/TypeScript
2. Confirm Mastra framework context integration patterns
3. Research conversation storage best practices
4. Validate performance constraints for context retrieval

## Key Technical Decisions

### 1. Database Choice: PostgreSQL
**Decision**: PostgreSQL para producción, SQLite para MVP/testing
**Rationale**: 
- JSONB support para almacenamiento flexible de contexto
- Escalabilidad probada para aplicaciones conversacionales
- Índices optimizados para búsquedas por participante/timestamp
- Transacciones ACID para consistencia de datos

### 2. Schema Design
**Conversation Context Structure**:
```sql
CREATE TABLE conversation_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_type VARCHAR(10) NOT NULL CHECK (context_type IN ('user', 'group')),
    participants TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context_id UUID NOT NULL REFERENCES conversation_contexts(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_contexts_type_participants ON conversation_contexts(context_type, participants);
CREATE INDEX idx_contexts_expires_at ON conversation_contexts(expires_at);
CREATE INDEX idx_messages_context_timestamp ON conversation_messages(context_id, timestamp DESC);
```

### 3. Context Retrieval Strategy
**Decision**: Retrieval basado en relevancia temporal y límites de performance
**Implementation**:
- Recuperar últimos 50 mensajes por defecto
- Priorizar mensajes de las últimas 24 horas
- Implementar paginación para conversaciones largas
- Cache en memoria para contextos accedidos frecuentemente

### 4. Data Retention Policy
**Decision**: Auto-cleanup de contextos expirados
**Implementation**:
- Scheduled job cada 6 horas para cleanup
- Notificación 7 días antes de expiración
- Soft delete con periodo de gracia de 7 días

## Technology Stack Validation

### Node.js + PostgreSQL Integration
**Library**: `pg` (PostgreSQL client)
**Connection Pooling**: Built-in pool management
**Migration Strategy**: Simple SQL scripts en `infra/persistence/migrations/`

### Mastra Framework Integration
**Integration Points**:
- Context injection en agent responses vía Mastra tools
- Webhook integration para captura de mensajes
- Response enhancement con contexto histórico

### Performance Considerations
**Target Metrics**:
- Context retrieval: <500ms
- Message storage: <100ms
- Auto-cleanup: Background, no impact en runtime

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
1. **PostgreSQL + pg library**: Standard, bien soportado
2. **Hexagonal architecture**: Separation clara entre core y adapters
3. **JSONB storage**: Flexible para evolución del schema
4. **Scheduled cleanup**: Reliable con cron jobs

### ⚠️ Areas Requiring Attention
1. **Mastra integration**: Necesita research adicional con Context7 MCP
2. **Context relevance**: Algorithm complejo, empezar simple
3. **Performance monitoring**: Métricas desde día 1

### 🚫 Rejected Approaches
1. **NoSQL solutions**: Overkill para MVP, menos consistencia
2. **In-memory only**: No persistence, pérdida de contexto en restarts
3. **File-based storage**: No escalable, difficult backup/recovery

## Next Steps - Phase 1
1. Create data model interfaces in core/
2. Design OpenAPI contracts for context endpoints
3. Implement PostgreSQL adapter
4. Create basic CRUD use cases
5. Setup contract tests and validation

## References
- [To be filled with Context7 MCP research results]
- PostgreSQL JSONB documentation
- Node.js pg library documentation
- Mastra framework integration patterns