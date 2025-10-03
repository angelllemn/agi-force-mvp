

<!--
Sync Impact Report (Updated: 2025-10-03):
- Version change: 1.0.0 → 1.1.0 (MINOR - enhanced architecture guidance and quality standards)
- Modified principles:
  - Architecture & Design: Enhanced hexagonal/clean architecture requirements
  - Code Standards: Strengthened TypeScript strictness and error handling
  - Testing & Quality: Added specific coverage and testing strategy requirements
  - Observability: Enhanced structured logging and correlation ID requirements
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md - Constitution Check section aligns with new principles
  ✅ spec-template.md - Architecture constraints properly referenced
  ✅ tasks-template.md - Task categorization reflects principle-driven development
- Follow-up TODOs: None
-->

# Constitución de Desarrollo — PulseDesk (MVP)

**Versión:** 1.1.0  
**Ratificada:** 2025-10-01  
**Última enmienda:** 2025-10-03

## 1) Propósito y alcance
Construir un **agente Slack‑first** sobre **Mastra** que demuestre:
- **Contexto persistente**
- **Capabilities/acciones** (integraciones reales)
- **Proactividad** (recordatorios, avisos, nudges)

El MVP inicia con un **hola mundo Slack ↔ Mastra** y escalará gradualmente hacia PulseDesk (KB/RAG, tickets, recordatorios).

## 2) Idioma y estilo
- Idioma **oficial: español** (issues, PRs, commits, docs, ejemplos).
- Comunicación clara, concisa y orientada a **contratos** y **criterios de aceptación**.

## 3) Método: Spec‑Driven Development (SDD) — **NO negociable**
1. **Especificaciones primero**: OpenAPI (endpoints propios) y JSON Schema (capabilities/tools).
2. **Pruebas después**: contract tests + unit + integración (y E2E cuando corresponda).
3. **Implementación al final**: lo mínimo para que el CI esté **verde**.

**Reglas duras**
- No se mezcla **cambio de contrato** con **implementación** en el mismo PR.
- Todo cambio en `openapi/` o `schemas/` debe venir con **tests** (que fallen antes y pasen después).
- **Todos los tests deben pasar antes de abrir un PR a `main`** (regla del equipo) y el **CI debe estar verde** para poder hacer merge.

## 4) Arquitectura y diseño — **Hexagonal/Clean obligatorio**

### Principios fundamentales
- **Arquitectura hexagonal/clean** OBLIGATORIA para toda funcionalidad del MVP:
  - **Core (dominio)**: entidades, value objects, reglas puras (sin dependencias de framework).
  - **Ports** (interfaces) y **Adapters** (implementaciones concretas).
  - **Use‑cases/Services** en capa de aplicación para orquestar reglas de negocio.

### Estructura de puertos obligatorios
- **core/ports/**: Interfaces que DEBEN implementarse:
  - `TicketRepository`: gestión de tickets/issues
  - `KnowledgeSearch`: búsqueda en KB/RAG  
  - `Notifier`: envío de notificaciones (Slack, email)
  - `AgentClient`: comunicación con Mastra
  - `Scheduler`: gestión de tareas programadas/proactividad

### Implementaciones en adapters/
- **SlackBolt**: adapter para Slack Socket Mode
- **MastraHTTP**: adapter para comunicación con Mastra
- **Jira/Linear**: adapters para sistemas de tickets
- **Email**: adapter para notificaciones email
- **RAG**: adapter para búsqueda semántica

### Infraestructura (infra/)
- **config/**: validación de configuración con Zod (fail-fast)
- **logging/**: logs estructurados con IDs de correlación
- **jobs/**: scheduler para proactividad
- **persistence/**: almacenamiento si aplica

**Patrones recomendados**:
- **DTOs + mapeadores** entre capas.
- **Result/Either** o errores tipados; manejo de excepciones controlado.
- **Dependency Injection** ligera (factories/constructores).
- **Idempotencia** y **reintentos** con backoff en integraciones externas.
- **Circuit breaker** simple para APIs de terceros.
- **Separación de comandos/consultas** (CQS) cuando aporte claridad.

**Evolución**: empezar simple; añadir funcionalidad manteniendo la estructura hexagonal.

## 5) Estructura de carpetas — **MVP Minimalista**
```
/openapi/                      # Contratos propios (YAML)
/schemas/capabilities/         # JSON Schemas de tools (contratos)
/src/
  core/                        # Dominio - SIN dependencias externas
    entities/                  # Entidades de negocio (User, Ticket, etc.)
    value-objects/             # VOs (TicketId, UserId, etc.)
    use-cases/                 # Casos de uso puros
    ports/                     # Interfaces OBLIGATORIAS
      TicketRepository.ts      # → Gestión de tickets
      KnowledgeSearch.ts       # → Búsqueda KB/RAG
      Notifier.ts              # → Notificaciones
      AgentClient.ts           # → Comunicación Mastra
      Scheduler.ts             # → Tareas programadas
    errors/                    # Errores de dominio tipados
  adapters/                    # Implementaciones de ports
    slack/                     # SlackBolt: handlers, parser, responders
    mastra/                    # MastraHTTP: agents, tools, communication
    integrations/              # Jira/Linear/Google/MSFT adapters
      jira/
      linear/
      email/
      rag/
  infra/                       # Infraestructura
    config/                    # Validación env con Zod (OBLIGATORIO)
    logging/                   # Logs estructurados + correlationId
    jobs/                      # Scheduler para proactividad
    persistence/               # Repos/DB si necesario
  shared/                      # Tipos, utils, Result, constantes
/tests/
  unit/                        # Tests de core/ y use-cases
  contract/                    # Validación OpenAPI/JSON Schemas
  integration/                 # Tests de adapters con mocks
/docs/                         # ADRs, decisiones técnicas
```

## 6) Estándares de código — **Calidad mínima NO negociable**

### TypeScript estricto
- **OBLIGATORIO**: `"strict": true`, `noImplicitAny`, `noImplicitReturns`
- **Boundary enforcement**: `core/` NO puede importar de `adapters/` ni `infra/`
- **Tipos explícitos**: interfaces para todos los contratos entre capas

### Linting y formato
- **ESLint + Prettier**: configuración estricta sin excepciones
- **Imports ordenados**: agrupación lógica (core → adapters → infra → external)
- **Funciones pequeñas**: máximo ~50 líneas; refactor si excede

### Manejo de errores centralizado
- **OBLIGATORIO**: errores tipados en `src/core/errors/`
- **Result/Either pattern**: para operaciones que pueden fallar
- **No exceptions**: en lógica de negocio; usar Result types
- **Logging estructurado**: todos los errores con correlationId

### Configuración y environment
- **Zod validation**: TODA configuración validada en `infra/config/`
- **Fail-fast**: aplicación no inicia si configuración inválida
- **Tipos derivados**: from Zod schemas para type safety

## 7) Pruebas y cobertura — **Estrategia específica MVP**

### Pirámide de testing
- **Unitarias (80%)**: `core/` y `use-cases/` - rápidas y exhaustivas
- **Integración (15%)**: `adapters/` con mocks/stubs externos  
- **Contract (5%)**: validación OpenAPI/JSON Schemas
- **E2E**: mínimas, solo flujos críticos

### Cobertura obligatoria
- **≥ 90%** en `core/` (entidades, use-cases, value-objects)
- **≥ 80%** en `adapters/` (manejo de errores y mappings)
- **100%** en contract tests (schemas válidos e inválidos)

### Testing de casos de uso
- **Builders/factories**: para objetos de dominio
- **Test doubles**: mocks para ports/interfaces
- **Scenarios**: casos felices + edge cases + error handling

### Regla de PR
- **CI verde obligatorio**: typecheck + lint + tests al 100%
- **Contract tests**: validación automática de schemas
- **Coverage gates**: PR bloqueado si cobertura disminuye

## 8) Observabilidad — **Requisitos mínimos MVP**

### Logging estructurado
- **OBLIGATORIO**: Pino o similar con formato JSON
- **Correlation IDs**: en TODAS las operaciones (request/response)
- **Levels**: ERROR, WARN, INFO, DEBUG con contexto apropiado
- **Structured data**: no concatenación de strings

### Métricas básicas
- **Latencia**: tiempo de respuesta Slack < 2s
- **Éxito/Error**: tasas por adapter y use-case
- **Reintentos**: conteo y backoff en integraciones

### Trace opcional
- **OpenTelemetry**: para integraciones críticas (Mastra, Slack)
- **Correlation**: request tracking across components
- **Performance**: identificar bottlenecks en el pipeline

### Monitoreo de errores
- **Sentry** (opcional): para errores en producción
- **Error categorization**: por tipo y origen (core vs adapter)

## 9) CI/CD y quality gates — **Estricto para MVP**
- CI obligatorio en cada PR:
  - `typecheck` (tsc --noEmit), `lint` (ESLint), `format` (Prettier)
  - `test:unit`, `test:integration`, `test:contract`
  - **Spectral** para lint de OpenAPI
  - **OSV/npm audit** para dependencias
- **Branch protection**: merge bloqueado sin checks verdes + ≥1 revisor
- **PRs pequeños**: < 300 LOC netas; dividir si excede
- **Coverage gates**: CI falla si cobertura < thresholds

## 10) Seguridad y secretos
- Secrets solo en **variables de entorno/secret store** (nunca en repo).
- **Principio de mínimo privilegio** para tokens/Scopes (Slack/Jira/Google/MSFT).
- **PII**: redacción en logs, no almacenar tokens/IDs sensibles.
- **Rotación** periódica de claves y revisión de permisos.

## 11) Proactividad (MVP)
- Triggers por **timers** (SLA 48h) y **webhooks** (status de ticket).
- **Lógica de negocio** separada (aprobaciones/SLA/auditoría) en `core/use-cases/`, reusable desde adapters.

## 12) Contratos y versionado
- **OpenAPI** y **JSON Schemas** viven en repo y se versionan por **SemVer**.
- Cambios incompatibles → `MAJOR` + nota de ruptura y plan de migración.
- Antes de implementar: actualizar **specs + tests** y abrir PR de **solo contratos**.

## 13) Flujo Git
- **Trunk‑based** con ramas cortas: `spec/...`, `feat/...`, `fix/...`, `docs/...`.
- PRs enlazados a Issue con criterios de aceptación claros.
- **Prohibido** merge directo a `main`; siempre PR + CI.

## 14) Entregable y despliegue (cuando toque)
- **Dockerfile** slim (`node:20-alpine`), `npm ci`, usuario no root, `HEALTHCHECK`.
- Configuración **12‑factor** vía envs; un artefacto por servicio.
- **Rollback** simple (tag/imágen previa) y versionado SemVer.
- **Changelog** (convencional commits) en releases.

## 15) Definition of Done (DoD)
**PR de especificaciones**
- OpenAPI/JSON Schemas actualizados y validados (con ejemplos).
- Contract tests en verde.
- Documentación mínima del cambio.

**PR de implementación**
- Respeta arquitectura hexagonal; interfaces en `core/ports/` implementadas.
- `typecheck + lint + tests` pasan con cobertura ≥ thresholds.
- Manejo de errores tipado y logs estructurados con correlationId.
- Sin secretos en texto plano; configuración validada con Zod.
- Sin deuda técnica "rápida"; TODOs deben tener Issue asociado.

## 16) Gobernanza
Cambios a esta constitución requieren **PR** etiquetado `constitution`, explicación de impacto y aprobación del **Tech Lead**. Se incrementa la versión según SemVer y se registra la fecha de enmienda."strict": true`, `noImplicitAny`, `noImplicitReturns`.
- **Linter/formatter**: ESLint + Prettier; imports ordenados; evita funciones > ~50 líneas.
- **Convenciones**: nombres expresivos, módulos pequeños, funciones puras cuando aplique.
- **Errores**: centralizar tipos/errores (`src/core/errors`) y respuestas coherentes.
- **Configuración tipada**: validar `.env` con **Zod** en `infra/config`, fail‑fast si falta algo.
- **Boundary de dependencias**: `core/` no importa de `adapters/` ni `infra/`.
- **Commits**: Convencional Commits (`feat:`, `fix:`, `chore:`, `spec:`, `test:`, `docs:`).

## 7) Pruebas y cobertura
- **Pirámide**: unitarias (rápidas y muchas), integración (focalizadas), E2E (mínimas).
- **Contract tests**:
  - OpenAPI válido (parser/validator).
  - JSON Schemas válidos (AJV) + ejemplos **válidos e inválidos**.
- **Cobertura mínima**: ≥ 80% en `core/` y `app/`.
- **Datos de prueba**: builders/fábricas; evitar fixtures frágiles.
- **Regla de PR**: sin tests en verde **no** se mergea.

## 8) CI/CD y quality gates
- CI obligatorio en cada PR:
  - `typecheck` (tsc), `lint`, `test`, **contract tests** (OpenAPI/JSON Schemas).
  - (Opcional) **Spectral** para lint de OpenAPI; **OSV/`npm audit`** para dependencias.
- **Branch protection**: bloquea merge sin checks en verde y **≥1 revisor**.
- **PRs pequeños** (< ~300 LOC netas); dividir si excede.
- **Plantillas**: usar templates de Issue/PR con checklist (tests, contratos, docs).

## 9) Seguridad y secretos
- Secrets solo en **variables de entorno/secret store** (nunca en repo).
- **Principio de mínimo privilegio** para tokens/Scopes (Slack/Jira/Google/MSFT).
- **PII**: redacción en logs, no almacenar tokens/IDs sensibles.
- **Rotación** periódica de claves y revisión de permisos.

## 10) Observabilidad y operabilidad
- **Logging estructurado** (pino) con `requestId/correlationId`.
- **Métricas básicas**: latencia, tasa de éxito/error, reintentos.
- **Trazas** (OpenTelemetry) opcional en integraciones críticas.
- **Rendimiento**:
  - Respuestas de Slack < **2s** (usar `ack` + respuesta diferida si es necesario).
  - Reintentos con **backoff** y timeouts razonables.

## 11) Proactividad (MVP)
- Triggers por **timers** (SLA 48h) y **webhooks** (status de ticket).
- **Lógica de negocio** separada (aprobaciones/SLA/auditoría) en `app/services`, reusable desde adapters.

## 12) Contratos y versionado
- **OpenAPI** y **JSON Schemas** viven en repo y se versionan por **SemVer**.
- Cambios incompatibles → `MAJOR` + nota de ruptura y plan de migración.
- Antes de implementar: actualizar **specs + tests** y abrir PR de **solo contratos**.

## 13) Flujo Git
- **Trunk‑based** con ramas cortas: `spec/...`, `feat/...`, `fix/...`, `docs/...`.
- PRs enlazados a Issue con criterios de aceptación claros.
- **Prohibido** merge directo a `main`; siempre PR + CI.

## 14) Entregable y despliegue (cuando toque)
- **Dockerfile** slim (`node:20-alpine`), `npm ci`, usuario no root, `HEALTHCHECK`.
- Configuración **12‑factor** vía envs; un artefacto por servicio.
- **Rollback** simple (tag/imágen previa) y versionado SemVer.
- **Changelog** (convencional commits) en releases.

## 15) Definition of Done (DoD)
**PR de especificaciones**
- OpenAPI/JSON Schemas actualizados y validados (con ejemplos).
- Contract tests en verde.
- Documentación mínima del cambio.

**PR de implementación**
- Respeta contratos; `typecheck + lint + tests` pasan.
- Manejo de errores y logs adecuados; sin secretos en texto plano.
- Sin deuda técnica “rápida”; TODOs deben tener Issue asociado.

## 16) Gobernanza
Cambios a esta constitución requieren **PR** etiquetado `constitution`, explicación de impacto y aprobación del **Tech Lead**. Se incrementa la versión y se registra la fecha de enmienda.