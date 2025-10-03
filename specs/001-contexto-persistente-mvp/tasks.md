# Tasks: Contexto Persistente (MVP)

**Input**: Design documents from `/specs/001-contexto-persistente-mvp/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Node.js v20 + TypeScript, Express.js, Mastra, Zod, Pino
   → Storage: PostgreSQL (production) / SQLite (MVP testing)
   → Structure: Hexagonal architecture with core/adapters/infra
2. Load optional design documents ✅:
   → data-model.md: ConversationContext, Message, ConversationHistory entities
   → contracts/: context-api.yaml with 6 endpoints
   → research.md: PostgreSQL decisions, schema design, cleanup strategy
3. Generate tasks by category ✅:
   → Setup: project structure, dependencies, database setup
   → Tests: contract tests, integration tests (TDD first)
   → Core: entities, ports, use cases, errors
   → Integration: PostgreSQL adapter, Slack integration, cleanup service
   → Polish: unit tests, performance validation, documentation
4. Apply task rules ✅:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness ✅:
   → All 6 contract endpoints have tests ✅
   → All 3 entities have models ✅
   → All endpoints implemented ✅
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root (per plan.md)
- Hexagonal architecture: `src/core/`, `src/adapters/`, `src/infra/`

## Phase 3.1: Setup
- [ ] T001 Configure PostgreSQL schema and migrations in `src/infra/persistence/migrations/001_initial_schema.sql`
- [ ] T002 [P] Setup database connection and pooling in `src/infra/persistence/connection.ts`
- [ ] T003 [P] Configure environment validation with Zod in `src/infra/config/database.ts`
- [ ] T004 [P] Setup structured logging with Pino in `src/infra/logging/context-logger.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test POST /api/v1/context in `tests/contract/create-context.test.ts`
- [ ] T006 [P] Contract test GET /api/v1/context in `tests/contract/find-context.test.ts`
- [ ] T007 [P] Contract test POST /api/v1/context/{id}/messages in `tests/contract/add-message.test.ts`
- [ ] T008 [P] Contract test GET /api/v1/context/{id}/messages in `tests/contract/get-messages.test.ts`
- [ ] T009 [P] Contract test DELETE /api/v1/context/{id} in `tests/contract/delete-context.test.ts`
- [ ] T010 [P] Contract test POST /api/v1/context/cleanup in `tests/contract/cleanup-context.test.ts`
- [ ] T011 [P] Integration test user DM context flow in `tests/integration/user-context.test.ts`
- [ ] T012 [P] Integration test group context flow in `tests/integration/group-context.test.ts`
- [ ] T013 [P] Integration test context cleanup and expiration in `tests/integration/context-cleanup.test.ts`
- [ ] T014 [P] Integration test Slack bot context integration in `tests/integration/slack-integration.test.ts`

## Phase 3.3: Core Domain (ONLY after tests are failing)
- [ ] T015 [P] ConversationContext entity in `src/core/entities/ConversationContext.ts`
- [ ] T016 [P] Message entity in `src/core/entities/Message.ts`
- [ ] T017 [P] ConversationHistory aggregate in `src/core/entities/ConversationHistory.ts`
- [ ] T018 [P] Domain errors in `src/core/errors/ContextErrors.ts`
- [ ] T019 [P] ContextFilter and MessageFilter value objects in `src/core/value-objects/Filters.ts`
- [ ] T020 [P] ConversationRepository port in `src/core/ports/ConversationRepository.ts`
- [ ] T021 [P] ContextRetrievalService port in `src/core/ports/ContextRetrievalService.ts`
- [ ] T022 [P] ContextCleanupService port in `src/core/ports/ContextCleanupService.ts`

## Phase 3.4: Use Cases
- [ ] T023 [P] CreateContextUseCase in `src/core/use-cases/CreateContextUseCase.ts`
- [ ] T024 [P] AddMessageUseCase in `src/core/use-cases/AddMessageUseCase.ts`
- [ ] T025 [P] RetrieveContextUseCase in `src/core/use-cases/RetrieveContextUseCase.ts`
- [ ] T026 [P] DeleteContextUseCase in `src/core/use-cases/DeleteContextUseCase.ts`
- [ ] T027 [P] CleanupExpiredContextsUseCase in `src/core/use-cases/CleanupExpiredContextsUseCase.ts`
- [ ] T028 [P] GetMessagesUseCase in `src/core/use-cases/GetMessagesUseCase.ts`

## Phase 3.5: Adapters Implementation
- [ ] T029 PostgresConversationRepository adapter in `src/adapters/postgres/PostgresConversationRepository.ts`
- [ ] T030 [P] InMemoryConversationRepository for testing in `src/adapters/memory/InMemoryConversationRepository.ts`
- [ ] T031 ContextRetrievalServiceImpl in `src/adapters/postgres/ContextRetrievalServiceImpl.ts`
- [ ] T032 ContextCleanupServiceImpl with scheduling in `src/adapters/postgres/ContextCleanupServiceImpl.ts`
- [ ] T033 [P] SlackContextIntegration adapter in `src/adapters/slack/SlackContextIntegration.ts`

## Phase 3.6: API Layer
- [ ] T034 Context controller for create/find endpoints in `src/adapters/http/ContextController.ts`
- [ ] T035 Message controller for add/get endpoints in `src/adapters/http/MessageController.ts`
- [ ] T036 Admin controller for cleanup endpoint in `src/adapters/http/AdminController.ts`
- [ ] T037 Express router configuration in `src/adapters/http/routes/contextRoutes.ts`
- [ ] T038 Request validation middleware in `src/adapters/http/middleware/validation.ts`
- [ ] T039 Error handling middleware in `src/adapters/http/middleware/errorHandler.ts`

## Phase 3.7: Integration & Infrastructure
- [ ] T040 Database migration runner in `src/infra/persistence/migrationRunner.ts`
- [ ] T041 [P] Health check endpoints in `src/adapters/http/HealthController.ts`
- [ ] T042 [P] CORS and security middleware in `src/adapters/http/middleware/security.ts`
- [ ] T043 Dependency injection container in `src/infra/container/DIContainer.ts`
- [ ] T044 Application startup and configuration in `src/app.ts`

## Phase 3.8: Polish & Performance
- [ ] T045 [P] Unit tests for ConversationContext entity in `tests/unit/entities/ConversationContext.test.ts`
- [ ] T046 [P] Unit tests for use cases in `tests/unit/use-cases/CreateContextUseCase.test.ts`
- [ ] T047 [P] Unit tests for PostgresConversationRepository in `tests/unit/adapters/PostgresConversationRepository.test.ts`
- [ ] T048 [P] Performance tests for context retrieval (<500ms) in `tests/performance/context-retrieval.test.ts`
- [ ] T049 [P] Load tests for concurrent conversations in `tests/performance/concurrent-contexts.test.ts`
- [ ] T050 [P] Update API documentation in `docs/api-context.md`
- [ ] T051 [P] Docker Compose configuration in `docker-compose.context.yml`
- [ ] T052 Validate quickstart guide scenarios in `tests/e2e/quickstart-validation.test.ts`

## Dependencies
**Strict ordering requirements:**
- Setup (T001-T004) before everything else
- Tests (T005-T014) before ANY implementation (T015+)
- Entities (T015-T019) before use cases (T023-T028)
- Ports (T020-T022) before adapters (T029-T033)
- Use cases (T023-T028) before controllers (T034-T036)
- Controllers (T034-T036) before routes (T037)
- Core implementation (T015-T038) before infrastructure (T040-T044)
- Everything before polish (T045-T052)

**Blocking dependencies:**
- T029 (PostgresRepository) blocks T031, T032 (services using it)
- T020-T022 (ports) block T029-T033 (adapters implementing them)
- T037 (routes) blocks T044 (app startup)
- T001 (schema) blocks T029 (PostgreSQL adapter)

## Parallel Execution Examples

### Phase 3.2 - All Contract Tests (After Setup)
```bash
# Launch T005-T010 together (different contract test files):
Task: "Contract test POST /api/v1/context in tests/contract/create-context.test.ts"
Task: "Contract test GET /api/v1/context in tests/contract/find-context.test.ts"
Task: "Contract test POST /api/v1/context/{id}/messages in tests/contract/add-message.test.ts"
Task: "Contract test GET /api/v1/context/{id}/messages in tests/contract/get-messages.test.ts"
Task: "Contract test DELETE /api/v1/context/{id} in tests/contract/delete-context.test.ts"
Task: "Contract test POST /api/v1/context/cleanup in tests/contract/cleanup-context.test.ts"
```

### Phase 3.3 - Core Domain Models
```bash
# Launch T015-T019 together (different entity files):
Task: "ConversationContext entity in src/core/entities/ConversationContext.ts"
Task: "Message entity in src/core/entities/Message.ts"
Task: "ConversationHistory aggregate in src/core/entities/ConversationHistory.ts"
Task: "Domain errors in src/core/errors/ContextErrors.ts"
Task: "ContextFilter and MessageFilter value objects in src/core/value-objects/Filters.ts"
```

### Phase 3.4 - Use Cases
```bash
# Launch T023-T028 together (different use case files):
Task: "CreateContextUseCase in src/core/use-cases/CreateContextUseCase.ts"
Task: "AddMessageUseCase in src/core/use-cases/AddMessageUseCase.ts"
Task: "RetrieveContextUseCase in src/core/use-cases/RetrieveContextUseCase.ts"
Task: "DeleteContextUseCase in src/core/use-cases/DeleteContextUseCase.ts"
Task: "CleanupExpiredContextsUseCase in src/core/use-cases/CleanupExpiredContextsUseCase.ts"
Task: "GetMessagesUseCase in src/core/use-cases/GetMessagesUseCase.ts"
```

## Notes
- **[P] tasks** = different files, no dependencies between them
- **Verify tests fail** before implementing corresponding functionality
- **Commit after each task** for atomic changes
- **Follow constitutional requirements**: TypeScript strict, hexagonal architecture, Zod validation
- **Performance targets**: Context retrieval <500ms, response time <2s
- **Data retention**: 30-day policy with cleanup automation

## Task Generation Rules Applied
1. **From Contracts**: 6 endpoints → 6 contract tests (T005-T010) [P]
2. **From Data Model**: 3 entities → 3 model tasks (T015-T017) [P]
3. **From User Stories**: 4 integration scenarios → 4 integration tests (T011-T014) [P]
4. **Ordering**: Setup → Tests → Models → Services → Controllers → Infrastructure → Polish
5. **Dependencies**: Tests block implementation, models block services, services block controllers

## Validation Checklist ✅
- [x] All 6 contract endpoints have corresponding tests
- [x] All 3 entities (ConversationContext, Message, ConversationHistory) have model tasks
- [x] All tests (T005-T014) come before implementation (T015+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Constitutional requirements (hexagonal architecture, TDD, TypeScript strict) reflected in tasks