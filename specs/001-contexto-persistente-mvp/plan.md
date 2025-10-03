
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
Implementar contexto persistente para el bot AGI Force que mantenga historial de conversación separado por usuario (DMs) y grupos (channels). El sistema debe almacenar únicamente texto de mensajes y timestamps por 30 días, permitir recuperación de contexto relevante para respuestas apropiadas, y manejar referencias ambiguas pidiendo clarificación al usuario.

## Technical Context
**Language/Version**: Node.js v20 + TypeScript (strict mode)
**Primary Dependencies**: Express.js, Mastra Framework, Zod, Pino
**Storage**: PostgreSQL (production) / SQLite (MVP testing)
**Testing**: Jest (unit + integration), Spectral (contract validation)
**Target Platform**: Linux server (Docker containers)
**Project Type**: Backend service (bot integration)
**Performance Goals**: <2s response time, context retrieval <500ms
**Constraints**: 30-day retention policy, text-only storage (MVP), separate contexts per user/group
**Scale/Scope**: MVP scope - basic persistence and retrieval, ~10-100 concurrent conversations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Arquitectura Hexagonal/Clean (OBLIGATORIO)
- [ ] **Core ports defined**: ConversationRepository, ContextRetrieval, ConversationContext
- [ ] **Adapters planned**: PostgreSQL adapter, memory adapter (testing)
- [ ] **Domain isolation**: Core entities without external dependencies
- [ ] **Use cases**: Context storage, retrieval, cleanup services
- [ ] **Error handling**: Typed errors in core/errors/

### Spec-Driven Development (NO negociable)
- [ ] **OpenAPI first**: Context management endpoints in openapi/
- [ ] **JSON Schema**: ConversationContext, Message schemas
- [ ] **Contract tests**: Validation before implementation
- [ ] **Tests first**: Unit tests for core logic

### Context7 MCP Compliance
- [ ] **Research phase**: Use Context7 for PostgreSQL, Node.js documentation
- [ ] **Official sources only**: No blogs or unofficial tutorials
- [ ] **Version verification**: Confirm compatibility with project versions

### Calidad y Testing
- [ ] **TypeScript strict**: All types explicit, boundary enforcement
- [ ] **Coverage targets**: ≥90% core/, ≥80% adapters/
- [ ] **Zod validation**: Configuration and data validation
- [ ] **Structured logging**: Pino with correlation IDs

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

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->
```
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

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

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh codex`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

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
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Constitution Check (Re-evaluation)
*GATE: Re-check after Phase 1 design.*

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

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

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
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
