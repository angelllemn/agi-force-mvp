

<!--
Sync Impact Report (Updated: 2025-10-03):
- Version change: 1.2.0 → 1.3.0 (MINOR - enhanced language rules with code/documentation separation)
- Modified principles: 
  - Section 2) Idioma y estilo - expanded with functional code language requirements
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md - Constitution Check section aligns with language principles
  ✅ spec-template.md - Language requirements properly referenced
  ✅ tasks-template.md - Task categorization reflects coding standards
- Follow-up TODOs: None
-->

# Constitución de Desarrollo — PulseDesk (MVP)

**Versión:** 1.3.0  
**Ratificada:** 2025-10-01  
**Última enmienda:** 2025-10-03

## 1) Propósito y alcance
Construir un **agente Slack‑first** sobre **Mastra** que demuestre:
- **Contexto persistente**
- **Capabilities/acciones** (integraciones reales)
- **Proactividad** (recordatorios, avisos, nudges)

El MVP inicia con un **hola mundo Slack ↔ Mastra** y escalará gradualmente hacia PulseDesk (KB/RAG, tickets, recordatorios).

**Arquitectura objetivo:** Minimalista y suficiente para el MVP, siguiendo principios de **arquitectura hexagonal/clean** que permita evolución controlada y testing efectivo.

## 2) Idioma y estilo — **Reglas de idioma obligatorias**

### Código funcional
- **OBLIGATORIO**: Todo código funcional (variables, funciones, clases, interfaces, tipos, etc.) DEBE escribirse en **inglés**.
- **Naming conventions**: camelCase para variables/funciones, PascalCase para clases/interfaces, UPPER_SNAKE_CASE para constantes.
- **API contracts**: OpenAPI y JSON Schemas en inglés para interoperabilidad.

### Documentación y comentarios
- **OBLIGATORIO**: Comentarios en código, documentación técnica (README, ADRs, specs), y issues/PRs DEBEN escribirse en **español**.
- **Idioma oficial del proyecto**: español para toda comunicación (commits, mensajes de error de dominio, logs de negocio).
- **JSDoc/TSDoc**: comentarios de documentación de funciones en español.

### Excepciones controladas
- **Librerías externas**: mantener nomenclatura original en inglés (no traducir).
- **Standards externos**: HTTP status codes, métodos REST, etc. en inglés.
- **Error messages**: errores técnicos de sistema en inglés, errores de dominio en español.

### Principios generales
- Comunicación clara, concisa y orientada a **contratos** y **criterios de aceptación**.
- Consistencia en nomenclatura dentro del mismo contexto/módulo.
- **Separación semántica**: inglés para implementación, español para comunicación humana.

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

## 5) Documentación y fuentes oficiales — **Context7 MCP obligatorio**

### Principio fundamental
- **TODA** consulta de documentación de integraciones y tecnologías externas DEBE realizarse exclusivamente a través del **Context7 MCP**.
- **PROHIBIDO** usar documentación no oficial, blogs, tutoriales o fuentes no verificadas para decisiones de implementación.

### Context7 MCP como fuente única
- **Context7** es el **Model Context Protocol (MCP)** que provee documentación **probada y de fuentes oficiales**.
- **Obligatorio** consultar Context7 antes de implementar cualquier integración con:
  - **Slack APIs** (Bolt.js, Socket Mode, Web API)
  - **Mastra Framework** (agents, tools, workflows)
  - **Sistemas de tickets** (Jira, Linear, GitHub Issues)
  - **Servicios cloud** (AWS, Google Cloud, Azure)
  - **Frameworks y librerías** (Node.js, TypeScript, testing tools)

### Validación de fuentes
- **Documentación oficial únicamente**: Solo fuentes mantenidas por los creadores/mantenedores oficiales.
- **Versiones actualizadas**: Verificar que la documentación corresponde a la versión específica en uso.
- **Context7 verification**: Toda información técnica debe ser verificable a través de Context7.

### Proceso obligatorio de investigación
1. **Context7 first**: Consultar Context7 MCP para obtener documentación oficial
2. **Version check**: Verificar compatibilidad con versiones específicas del proyecto
3. **Official validation**: Confirmar que la información proviene de fuentes oficiales
4. **Documentation**: Documentar decisiones técnicas con referencias a fuentes oficiales

### Reglas de implementación
- **NO** implementar funcionalidad basada en documentación no oficial
- **NO** usar ejemplos de código de blogs o tutoriales no oficiales
- **NO** seguir guías de terceros sin validación oficial
- **SÍ** usar únicamente patrones y prácticas documentadas oficialmente vía Context7

**Excepción**: En casos donde Context7 no tenga información disponible, se debe:
1. Documentar explícitamente la limitación
2. Crear un Issue para investigación adicional
3. Obtener aprobación del Tech Lead antes de proceder
4. Marcar como deuda técnica para revisión posterior

## 6) Estructura de carpetas — **MVP Minimalista**
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

## 7) Estándares de código — **Calidad mínima NO negociable**

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

## 8) Pruebas y cobertura — **Estrategia específica MVP**

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

## 9) Observabilidad — **Requisitos mínimos MVP**

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

## 10) CI/CD y quality gates — **Estricto para MVP**
- CI obligatorio en cada PR:
  - `typecheck` (tsc --noEmit), `lint` (ESLint), `format` (Prettier)
  - `test:unit`, `test:integration`, `test:contract`
  - **Spectral** para lint de OpenAPI
  - **OSV/npm audit** para dependencias
- **Branch protection**: merge bloqueado sin checks verdes + ≥1 revisor
- **PRs pequeños**: < 300 LOC netas; dividir si excede
- **Coverage gates**: CI falla si cobertura < thresholds

## 11) Seguridad y secretos
- Secrets solo en **variables de entorno/secret store** (nunca en repo).
- **Principio de mínimo privilegio** para tokens/Scopes (Slack/Jira/Google/MSFT).
- **PII**: redacción en logs, no almacenar tokens/IDs sensibles.
- **Rotación** periódica de claves y revisión de permisos.

## 12) Proactividad (MVP)
- Triggers por **timers** (SLA 48h) y **webhooks** (status de ticket).
- **Lógica de negocio** separada (aprobaciones/SLA/auditoría) en `core/use-cases/`, reusable desde adapters.

## 13) Contratos y versionado
- **OpenAPI** y **JSON Schemas** viven en repo y se versionan por **SemVer**.
- Cambios incompatibles → `MAJOR` + nota de ruptura y plan de migración.
- Antes de implementar: actualizar **specs + tests** y abrir PR de **solo contratos**.

## 14) Flujo Git
- **Trunk‑based** con ramas cortas: `spec/...`, `feat/...`, `fix/...`, `docs/...`.
- PRs enlazados a Issue con criterios de aceptación claros.
- **Prohibido** merge directo a `main`; siempre PR + CI.

## 15) Entregable y despliegue (cuando toque)
- **Dockerfile** slim (`node:20-alpine`), `npm ci`, usuario no root, `HEALTHCHECK`.
- Configuración **12‑factor** vía envs; un artefacto por servicio.
- **Rollback** simple (tag/imágen previa) y versionado SemVer.
- **Changelog** (convencional commits) en releases.

## 16) Definition of Done (DoD)
**PR de especificaciones**
- OpenAPI/JSON Schemas actualizados y validados (con ejemplos).
- Contract tests en verde.
- Documentación mínima del cambio.

**PR de implementación**
- Respeta arquitectura hexagonal; interfaces en `core/ports/` implementadas.
- `typecheck + lint + tests` pasan con cobertura ≥ thresholds.
- Manejo de errores tipado y logs estructurados con correlationId.
- Sin secretos en texto plano; configuración validada con Zod.
- **Context7 compliance**: Documentación oficial verificada para todas las integraciones.
- Sin deuda técnica "rápida"; TODOs deben tener Issue asociado.

## 17) Gobernanza
Cambios a esta constitución requieren **PR** etiquetado `constitution`, explicación de impacto y aprobación del **Tech Lead**. Se incrementa la versión según SemVer y se registra la fecha de enmienda.