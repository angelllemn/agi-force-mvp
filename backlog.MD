# Especificaciones Testeables — PulseDesk MVP

> **Documento derivado de la constitución del proyecto**  
> **Versión:** 1.0.0 | **Fecha:** 2025-10-03

## 📋 Resumen

Este documento traduce los principios constitucionales en **especificaciones concretas y testeables** para el desarrollo del MVP de PulseDesk. Cada especificación incluye criterios de aceptación claros y estrategias de testing.

---

## 1. 💬 Contexto Persistente (MVP)

### Descripción
El bot debe mantener un historial de conversación para usuarios individuales y grupos, permitiendo responder con contexto apropiado.

### Criterios de Aceptación
- ✅ **Contexto por usuario**: Mantener historial individual en DMs
- ✅ **Contexto grupal**: Preservar contexto en canales/hilos
- ✅ **Caducidad configurable**: TTL del contexto por configuración
- ✅ **Isolación**: Contextos separados entre usuarios/grupos

### Estrategia de Testing
```typescript
// Ejemplo de test unitario
describe('ContextManager', () => {
  it('should maintain separate context for different users', () => {
    // Test implementation
  });
  
  it('should expire context after configured TTL', () => {
    // Test implementation  
  });
});
```

### Checklist Técnico
- [ ] Implementar `ContextRepository` en `core/ports/`
- [ ] Crear adapter de persistencia en `infra/persistence/`
- [ ] Tests unitarios para escenarios multiusuario
- [ ] Tests de caducidad temporal

---

## 2. ⚡ Capabilities y Acciones

### Descripción
El bot debe ejecutar acciones específicas mediante capacidades predefinidas, siguiendo el patrón hexagonal.

### Capabilities Requeridas
- 🎫 **Tickets**: Crear/actualizar en Jira/Linear
- 🔍 **Knowledge Base**: Búsquedas RAG/KB
- 📧 **Notificaciones**: Slack/Email

### Arquitectura Hexagonal
```
core/ports/
├── TicketRepository.ts      # Gestión de tickets
├── KnowledgeSearch.ts       # Búsqueda KB/RAG  
├── Notifier.ts             # Notificaciones
├── AgentClient.ts          # Comunicación Mastra
└── Scheduler.ts            # Tareas programadas

adapters/
├── slack/                  # SlackBolt adapter
├── mastra/                 # MastraHTTP adapter
└── integrations/
    ├── jira/              # Jira adapter
    ├── linear/            # Linear adapter
    └── email/             # Email adapter
```

### Checklist Técnico
- [ ] **Interfaces definidas** en `core/ports/`
  - [ ] `TicketRepository.ts`
  - [ ] `KnowledgeSearch.ts` 
  - [ ] `Notifier.ts`
  - [ ] `AgentClient.ts`
  - [ ] `Scheduler.ts`
- [ ] **Adapters implementados**
  - [ ] SlackBolt para comunicación Slack
  - [ ] MastraHTTP para agentes Mastra
  - [ ] Integración Jira/Linear básica
  - [ ] Sistema de email
- [ ] **Testing**
  - [ ] Tests unitarios con mocks para cada port
  - [ ] Tests de integración para adapters
  - [ ] Contract tests para APIs externas

---

## 3. 🔔 Proactividad

### Descripción
Implementar lógica para que el bot envíe recordatorios y avisos automáticamente basados en triggers temporales y eventos.

### Tipos de Proactividad
- ⏰ **Timers**: SLA de 48h para tickets
- 🔗 **Webhooks**: Cambios de estado en sistemas externos
- 📅 **Scheduled**: Recordatorios programados

### Arquitectura
```typescript
// core/use-cases/ProactiveNotifier.ts
interface ProactiveNotifier {
  scheduleReminder(ticket: Ticket, deadline: Date): Promise<void>;
  handleWebhookEvent(event: WebhookEvent): Promise<void>;
}

// infra/jobs/Scheduler.ts
interface SchedulerAdapter {
  schedule(task: ScheduledTask): Promise<void>;
  cancel(taskId: string): Promise<void>;
}
```

### Checklist Técnico
- [ ] **Core Logic**
  - [ ] `Scheduler` interface en `core/ports/`
  - [ ] `ProactiveNotifier` use case en `core/use-cases/`
  - [ ] Lógica de SLA y triggers en dominio
- [ ] **Infrastructure**
  - [ ] Adapter de jobs en `infra/jobs/`
  - [ ] Handler de webhooks en `adapters/`
- [ ] **Testing**
  - [ ] Tests unitarios para use cases
  - [ ] Tests de timing y scheduling
  - [ ] Integration tests con mocks temporales

---

## 4. 🏗️ Arquitectura Hexagonal (Clean Architecture)

### Descripción
Seguir arquitectura hexagonal estricta como base del diseño del sistema, garantizando testabilidad y mantenibilidad.

### Principios Arquitectónicos
- 🎯 **Core puro**: Sin dependencias externas
- 🔌 **Ports & Adapters**: Interfaces claras
- 📦 **Dependency Inversion**: Core no depende de detalles

### Estructura Obligatoria
```
src/
├── core/                    # ❌ NO external dependencies
│   ├── entities/           # Domain entities
│   ├── value-objects/      # Value objects  
│   ├── use-cases/         # Business logic
│   ├── ports/             # Interfaces (REQUIRED)
│   └── errors/            # Domain errors
├── adapters/              # ✅ External integrations
│   ├── slack/
│   ├── mastra/
│   └── integrations/
└── infra/                 # ✅ Infrastructure
    ├── config/
    ├── logging/
    └── persistence/
```

### Checklist Técnico
- [ ] **Boundary Enforcement**
  - [ ] `core/` sin imports de `adapters/` o `infra/`
  - [ ] ESLint rules para dependency boundaries
  - [ ] Tests que validen isolación
- [ ] **Interfaces Completas**
  - [ ] Todos los ports definidos en `core/ports/`
  - [ ] Adapters implementan interfaces
  - [ ] Dependency injection en bootstrap
- [ ] **Testing Architecture**
  - [ ] Tests unitarios solo para `core/`
  - [ ] Mocks para todas las interfaces
  - [ ] Integration tests para adapters

---

## 5. 📋 Contratos y Validación (Spec-Driven Development)

### Descripción
Todo desarrollo debe partir de especificaciones formales usando OpenAPI y JSON Schema, con validación automática.

### Flujo SDD Obligatorio
1. **Specs primero** → OpenAPI + JSON Schema
2. **Tests después** → Contract tests que fallan
3. **Implementación final** → Hacer tests verdes

### Estructura de Contratos
```
/openapi/                   # Endpoints propios
├── pulsedesk-api.yaml     # API principal
└── webhooks.yaml          # Webhooks externos

/schemas/capabilities/      # Tools y capabilities
├── ticket-tool.schema.json
├── kb-search.schema.json
└── notification.schema.json
```

### Checklist Técnico
- [ ] **Especificaciones**
  - [ ] OpenAPI specs en `/openapi/`
  - [ ] JSON Schemas en `/schemas/capabilities/`
  - [ ] Ejemplos válidos e inválidos
- [ ] **Contract Testing**
  - [ ] Tests que validan OpenAPI compliance
  - [ ] JSON Schema validation con AJV
  - [ ] Tests que fallan pre-implementación
- [ ] **Tooling**
  - [ ] Spectral para linting OpenAPI
  - [ ] Automated contract validation en CI
  - [ ] Schema-driven mock generation

---

## 6. 🔧 Estandarización del Código

### Descripción
Garantizar calidad de código mediante reglas estrictas y herramientas automáticas.

### Configuración Obligatoria
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Standards Aplicados
- 📏 **TypeScript**: Strict mode sin excepciones
- 🎨 **Formatting**: ESLint + Prettier automático
- 🧪 **Coverage**: ≥90% core/, ≥80% adapters/
- 🚫 **Error Handling**: Result/Either patterns

### Checklist Técnico
- [ ] **TypeScript Strict**
  - [ ] `strict: true` configurado
  - [ ] Boundary enforcement rules
  - [ ] Explicit return types en functions públicas
- [ ] **Linting & Formatting**
  - [ ] ESLint config sin warnings
  - [ ] Prettier automático en pre-commit
  - [ ] Import ordering rules
- [ ] **Error Management**
  - [ ] Centralized errors en `core/errors/`
  - [ ] Result types para operations
  - [ ] No throw exceptions en business logic
- [ ] **Configuration**
  - [ ] Zod validation para env vars
  - [ ] Fail-fast si config inválida
  - [ ] Typed config derivado de schemas

---

## 7. 📊 Observabilidad

### Descripción
Implementar logging estructurado, métricas básicas y correlation tracking para debugging y monitoring.

### Componentes de Observabilidad
- 📝 **Structured Logging**: Pino con JSON format
- 🔗 **Correlation IDs**: Request tracking
- 📈 **Basic Metrics**: Latency, success/error rates
- 🔍 **Optional Tracing**: OpenTelemetry para críticos

### Logging Strategy
```typescript
// Structured logging example
logger.info({
  correlationId: req.correlationId,
  operation: 'ticket.create',
  userId: req.user.id,
  duration: Date.now() - startTime,
  success: true
}, 'Ticket created successfully');
```

### Checklist Técnico
- [ ] **Structured Logging**
  - [ ] Pino configurado con JSON output
  - [ ] Correlation IDs en TODAS las operations
  - [ ] Log levels apropiados (ERROR, WARN, INFO, DEBUG)
  - [ ] No PII en logs
- [ ] **Metrics Collection**
  - [ ] Response time tracking
  - [ ] Success/error rate counters  
  - [ ] Retry attempt logging
  - [ ] External API latency
- [ ] **Testing Observability**
  - [ ] Tests que validen correlation ID propagation
  - [ ] Log assertion en integration tests
  - [ ] Metrics validation en tests

---

## 8. 🚀 CI/CD y Calidad

### Descripción
Automatizar validación de calidad en cada PR con gates estrictos y feedback rápido.

### Pipeline Obligatorio
```yaml
# CI Pipeline stages
stages:
  - lint          # ESLint + Prettier
  - typecheck     # tsc --noEmit  
  - test:unit     # Jest unit tests
  - test:integration # Integration tests
  - test:contract    # OpenAPI/Schema validation
  - audit         # npm audit + OSV
```

### Quality Gates
- 🚦 **Coverage**: ≥90% core/, ≥80% adapters/
- 🔒 **Branch Protection**: PR reviews required
- ✅ **All Green**: No merge con tests fallando
- 📏 **Size Limit**: <300 LOC netas por PR

### Checklist Técnico
- [ ] **CI Configuration**
  - [ ] All pipeline stages configured
  - [ ] Coverage reporting automático
  - [ ] Failure notifications
- [ ] **Quality Gates**
  - [ ] Branch protection rules active
  - [ ] Required reviewers configured
  - [ ] Auto-merge bloqueado si CI fails
- [ ] **Tooling Integration**
  - [ ] Spectral para OpenAPI linting
  - [ ] Dependency vulnerability scanning
  - [ ] Performance regression detection

---

## 9. 🔐 Seguridad

### Descripción
Asegurar que el código y las integraciones cumplen con principios básicos de seguridad y privacidad.

### Principios de Seguridad
- 🔑 **Secrets Management**: Solo env vars/secret stores
- 🎯 **Least Privilege**: Scopes mínimos en tokens
- 🙈 **PII Redaction**: No datos sensibles en logs
- 🔄 **Key Rotation**: Periodic credential refresh

### Security Checklist
- [ ] **Secrets Handling**
  - [ ] No hardcoded secrets en código
  - [ ] Environment variables validation
  - [ ] Secret rotation procedures documented
- [ ] **Access Control**
  - [ ] Minimum scopes para Slack/Jira tokens
  - [ ] API rate limiting implemented
  - [ ] Input validation en all endpoints
- [ ] **Data Protection**
  - [ ] PII redaction en logging
  - [ ] Data encryption at rest (si aplica)
  - [ ] Secure communication (HTTPS/TLS)
- [ ] **Testing Security**
  - [ ] Secret leak detection tests
  - [ ] Input validation tests
  - [ ] Authorization tests

---

## 10. ✅ Definition of Done (DoD)

### Descripción
Criterios claros y no negociables para considerar completo cualquier trabajo de desarrollo.

### DoD para PR de Especificaciones
- [ ] **OpenAPI** actualizado y válido
- [ ] **JSON Schemas** con ejemplos válidos/inválidos
- [ ] **Contract tests** implementados y verdes
- [ ] **Documentación** mínima del cambio

### DoD para PR de Implementación  
- [ ] **CI Pipeline** completamente verde
  - [ ] TypeScript typecheck pasa
  - [ ] ESLint sin warnings
  - [ ] Tests unitarios + integración pasan
  - [ ] Coverage ≥ thresholds definidos
- [ ] **Architecture Compliance**
  - [ ] Respeta arquitectura hexagonal
  - [ ] Core sin dependencias externas
  - [ ] Interfaces implementadas correctamente
- [ ] **Code Quality**
  - [ ] Logs estructurados con correlation IDs
  - [ ] Error handling con Result types
  - [ ] No secrets en plain text
  - [ ] Configuration validada con Zod
- [ ] **Documentation**
  - [ ] TODOs tienen issues asociados
  - [ ] ADRs actualizados si aplica
  - [ ] README updated si hay cambios de setup

### Validation Checklist
- [ ] **Functional**: Feature works como especificado
- [ ] **Technical**: Cumple standards de calidad
- [ ] **Security**: No vulnerabilities introducidas
- [ ] **Performance**: Responde en <2s para Slack
- [ ] **Maintainability**: Código es legible y testeable

---

## 📝 Notas de Implementación

### Priorización Sugerida
1. **P0**: Architecture setup + Core interfaces
2. **P1**: Basic Slack ↔ Mastra integration  
3. **P2**: Persistence + Context management
4. **P3**: Capabilities (Tickets, KB, Notifications)
5. **P4**: Proactivity + Advanced features

### Tracking Progress
- Usar este documento como checklist durante development
- Crear issues específicos para cada specification
- Link PRs a specifications correspondientes
- Update este documento conforme evoluciona el MVP

---

**📄 Documento vivo**: Este archivo debe actualizarse conforme evoluciona el proyecto, manteniendo siempre la alineación con la constitución del proyecto.