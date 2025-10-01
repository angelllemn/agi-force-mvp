

# Constitución de Desarrollo — PulseDesk (MVP)

**Versión:** 1.0.0  
**Ratificada:** 2025-10-01  
**Última enmienda:** 2025-10-01

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

## 4) Arquitectura y diseño (mantenible, testeable, deployable)
- **Arquitectura limpia / hexagonal**:
  - **Core (dominio)**: entidades, value objects, reglas puras (sin dependencias de framework).
  - **Ports** (interfaces) y **Adapters** (Slack, Mastra tools, HTTP, integraciones).
  - **Use‑cases/Services** en capa de aplicación para orquestar reglas de negocio.
- **Patrones recomendados**:
  - **DTOs + mapeadores** entre capas.
  - **Result/Either** o errores tipados; manejo de excepciones controlado.
  - **Dependency Injection** ligera (factories/constructores).
  - **Idempotencia** y **reintentos** con backoff en integraciones externas.
  - **Circuit breaker** simple para APIs de terceros.
  - **Separación de comandos/consultas** (CQS) cuando aporte claridad.
- **Evolución**: empezar simple; añadir colas/scheduler, RAG, repositorios y trazas a medida que el MVP lo requiera.

## 5) Estructura de carpetas (Node/TS + Mastra)
```
/openapi/                      # Contratos propios (YAML)
/schemas/capabilities/         # JSON Schemas de tools (contratos)
/src/
  core/                        # Dominio (entidades, VOs, reglas)
    entities/
    value-objects/
    use-cases/
    ports/                     # Interfaces (repos, gateways, queues)
    errors/
  app/                         # Aplicación (coordinación)
    services/                  # Orquestación de casos de uso
    mappers/
  adapters/                    # Entradas/Salidas
    slack/                     # Bolt handlers, parser, responders
    http/                      # API propia (Hono/Express) si aplica
    mastra/                    # agents/, tools/, rag/ (Mastra)
    integrations/              # jira/, linear/, google/, msft/, email/
  infra/                       # Implementaciones de ports
    config/                    # Carga/validación de env (Zod)
    logging/                   # Pino/OpenTelemetry (opcional)
    persistence/               # Repos/DB si aplica
    scheduler/                 # Jobs/timers (proactividad)
  shared/                      # Tipos, utils, Result, constantes
/tests/
  unit/
  contract/                    # OpenAPI/JSON Schemas
  integration/
  e2e/                         # (opcional más adelante)
/github/workflows/            # CI
/docs/                         # ADRs, notas técnicas
```

## 6) Estándares de código
- **TypeScript estricto**: `"strict": true`, `noImplicitAny`, `noImplicitReturns`.
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