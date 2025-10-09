# Implementation Plan: Contexto Persistente (MVP)

**Branch**: `001-contexto-persistente-mvp` | **Date**: 2024-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-contexto-persistente-mvp/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Implementar contexto persistente para el bot AGI Force que mantenga historial de conversación separado por usuario (DMs) y grupos (channels). El sistema debe almacenar únicamente texto de mensajes y timestamps por 30 días, permitir recuperación de contexto relevante para respuestas apropiadas, y manejar referencias ambiguas pidiendo clarificación al usuario. La persistencia se realizará sobre PostgreSQL (durable) y SQLite (modo desarrollo rápido) a través de Prisma, manteniendo contratos HTTP en sincronía con los esquemas Zod y pruebas de Spec Kit.

## Technical Context

**Language/Version**: Node.js v20 + TypeScript (strict mode)
**Primary Dependencies**: Mastra Framework, Prisma ORM, Zod, Pino, Slack Bolt
**Storage**: PostgreSQL (CI/producción) / SQLite (modo offline local)
**Testing**: Vitest (unit, integration, contract harness), Spec Kit (escenarios conversacionales), AJV + OpenAPI parser (contratos)
**Target Platform**: Linux server (Docker containers)
**Project Type**: Backend service (bot integration)
**Performance Goals**: <2s response time, context retrieval <500ms
**Constraints**: 30-day retention policy, text-only storage (MVP), separate contexts per user/group, limpieza automática documentada
**Scale/Scope**: MVP scope - basic persistence and retrieval, ~10-100 concurrent conversations

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Arquitectura Hexagonal/Clean (OBLIGATORIO)

- [ ] **Core ports defined**: ConversationRepository, ContextRetrieval, ContextCleanup en `src/core/ports`
- [ ] **Adapters planned**: Prisma/PostgreSQL adapter, memory adapter (testing)
- [ ] **Domain isolation**: Core entities sin dependencias externas
- [ ] **Use cases**: Context storage, retrieval, cleanup services
- [ ] **Error handling**: Typed errors en `src/core/errors`

### Spec-Driven Development (NO negociable)

- [ ] **OpenAPI first**: Context management endpoints en `openapi/context-api.yaml`
- [ ] **JSON Schema**: ConversationContext, Message schemas sincronizados con Prisma y Zod
- [ ] **Contract tests**: Validación antes de implementación (AJV + Vitest)
- [ ] **Tests first**: Unit tests para core logic y escenarios Spec Kit

### Context7 MCP Compliance

- [ ] **Research phase**: Use Context7 para Prisma, PostgreSQL, Mastra
- [ ] **Official sources only**: No blogs or unofficial tutorials
- [ ] **Version verification**: Confirm compatibility with project versions

### Calidad y Testing

- [ ] **TypeScript strict**: Tipos explícitos y enforcement en límites
- [ ] **Coverage targets**: ≥90% core/, ≥80% adapters/
- [ ] **Zod validation**: Configuración y validación de entrada/salida alineada con contratos
- [ ] **Structured logging**: Pino con correlation IDs y metadatos de conversación

### Idioma y Estilo

- [ ] **Código en inglés**: Variables, funciones, clases, interfaces
- [ ] **Documentación en español**: Comentarios, README, especificaciones
- [ ] **Consistencia**: Naming conventions y patrones establecidos

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

ios/ or android/

### Source Code (repository root)

```
src/
├── adapters/
│   ├── memory/
│   └── slack/
├── core/
│   ├── entities/
│   ├── errors/
│   ├── ports/
│   └── use-cases/
├── infra/
│   ├── config/
│   └── mastra/
└── slack-bridge.ts

tests/
├── integration/
├── unit/
└── specs.test.ts

specs/001-contexto-persistente-mvp/
├── contracts/
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
└── spec.md
```

**Structure Decision**: Proyecto único backend con carpeta `src/` y pruebas en `tests/`, siguiendo arquitectura hexagonal. Los artefactos de especificación viven bajo `specs/001-contexto-persistente-mvp/`.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

**Phase 1**: Design & Contracts
_Prerequisites: research.md complete_

1. **Refinar entidades y eventos** en `data-model.md`:
   - Interfaz de dominio y representación Prisma
   - Reglas de retención y políticas de limpieza
   - Restricciones de privacidad y acceso

2. **Actualizar contratos HTTP** a partir de requisitos funcionales:
   - Mantener `openapi/context-api.yaml` sincronizado con Zod y Prisma
   - Regenerar esquemas JSON si cambian campos

3. **Preparar harness de pruebas**:
   - Escenarios Spec Kit derivados de historias de usuario (DM y grupo)
   - Pruebas de contrato con Vitest + AJV que referencian el OpenAPI actualizado

4. **Planificar migraciones Prisma**:
   - Definir modelo `schema.prisma`
   - Documentar comandos `prisma migrate dev` y `prisma generate`

5. **Actualizar quickstart** con flujos Postgres/SQLite, comandos Prisma, ejecución Spec Kit

**Output**: data-model.md, contratos actualizados, pruebas fallando, quickstart.md alineado, plan de migraciones documented

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Constitution Check (Re-evaluation)

_GATE: Re-check after Phase 1 design._

### Arquitectura Hexagonal/Clean ✅

- [x] **Core ports defined**: ConversationRepository, ContextRetrieval, ContextCleanup en data-model.md
- [x] **Adapters planned**: PostgreSQL adapter, memory adapter (testing) especificados
- [x] **Domain isolation**: Core entities sin dependencias externas en data-model.md
- [x] **Use cases**: Context storage, retrieval, cleanup services definidos
- [x] **Error handling**: Typed errors en core/errors/ especificados

### Spec-Driven Development ✅

- [x] **OpenAPI first**: Context management endpoints en contracts/context-api.yaml
- [x] **JSON Schema**: ConversationContext, Message schemas completos
- [x] **Contract tests**: Validation antes de implementación planificada
- [x] **Tests first**: Unit tests para core logic especificados

### Context7 MCP Compliance ✅

- [x] **Research phase**: Documentación oficial de PostgreSQL y Node.js
- [x] **Official sources only**: No blogs o tutoriales no oficiales
- [x] **Version verification**: Compatibilidad con versiones del proyecto

### Calidad y Testing ✅

- [x] **TypeScript strict**: Todos los tipos explícitos, boundary enforcement
- [x] **Coverage targets**: ≥90% core/, ≥80% adapters/ especificado
- [x] **Zod validation**: Configuración y validación de datos
- [x] **Structured logging**: Pino con correlation IDs

### Idioma y Estilo ✅

- [x] **Código en inglés**: Variables, funciones, clases, interfaces en contratos
- [x] **Documentación en español**: Comentarios, README, especificaciones
- [x] **Consistencia**: Naming conventions y patrones establecidos

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) - research.md generated
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md generated
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (clarifications exist in spec.md)
- [x] Complexity deviations documented: None required - design follows constitution

**Generated Artifacts**:

- [x] research.md - Technical decisions and approach validation
- [x] data-model.md - Domain entities, repositories, and business rules
- [x] contracts/context-api.yaml - OpenAPI specification for context endpoints
- [x] quickstart.md - Development setup and usage guide

**Ready for**: `/tasks` command to generate implementation tasks

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
