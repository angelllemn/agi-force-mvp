# PulseDesk — MVP (Mastra + Slack)

> **Agente de soporte en Slack** con **contexto persistente**, **capabilities** (acciones/integraciones) y **proactividad** (recordatorios/avisos).  
> **Metodología:** *Spec-Driven Development* (SDD) — **especificaciones → tests → implementación**.

---

## Tabla de contenido
- [Objetivo y alcance](#objetivo-y-alcance)
- [Principios y reglas (SDD)](#principios-y-reglas-sdd)
- [Arquitectura y diseño](#arquitectura-y-diseño)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos](#requisitos)
- [Variables de entorno](#variables-de-entorno)
- [Guía rápida (hola mundo Slack ↔ Mastra)](#guía-rápida-hola-mundo-slack--mastra)
- [Integración con Slack (Socket Mode)](#integración-con-slack-socket-mode)
- [Spec-Driven Development (cómo trabajamos)](#spec-driven-development-cómo-trabajamos)
- [Calidad: tests, CI y normas](#calidad-tests-ci-y-normas)
- [Roadmap](#roadmap)
- [Seguridad y cumplimiento](#seguridad-y-cumplimiento)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## Objetivo y alcance

**P0 (este repo):**
1. **Base SDD:** OpenAPI mínimo + JSON Schemas + tests + CI.
2. **Hola mundo Slack ↔ Mastra:** puente en **Socket Mode** que responde a `@PulseDesk hola` invocando el agente **`pulsedesk`** en el dev server de **Mastra**.

**Evolución hacia PulseDesk (siguientes iteraciones):**
- **Memoria persistente** por usuario/hilo (preferencias, estado).
- **RAG/KB** para buscar en documentación interna.
- **Capabilities** iniciales: `kb.search`, `ticket.create`, `ticket.update`, `calendar.schedule`, `email.send`.
- **Proactividad:** nudges por SLA (timers) y avisos por webhooks (cambios de ticket).

---

## Principios y reglas (SDD)

- **Idioma:** todo en **español** (issues, PRs, commits, docs).
- **SDD no negociable:** primero **contratos** (OpenAPI/JSON Schema), luego **tests**, al final **implementación mínima**.
- **Reglas de PR:**
  - No mezclar **cambios de contrato** con **implementación grande** en el mismo PR.
  - **Todos los tests deben pasar** antes de merge a `main` (CI en verde y al menos 1 revisor).
- **Estándares de código:** TypeScript estricto, ESLint + Prettier, Zod para `.env`.

> La **Constitución del proyecto** vive en `.specify/memory/constitution.md`.

---

## Arquitectura y diseño

**Estilo:** *Arquitectura limpia / hexagonal*.
- **Core (dominio):** entidades, value objects, reglas (sin dependencias de framework).
- **Aplicación (use-cases/services):** orquesta reglas y políticas (aprobaciones, SLA, auditoría).
- **Adapters (entradas/salidas):**
  - **Slack** (Bolt) — Socket Mode.
  - **Mastra** — agentes, tools, RAG.
  - **Integraciones** — Jira/Linear, Google/Microsoft, Email/IdP.
  - **HTTP** propio (puente/health) opcional.
- **Infra:** configuración (Zod), logging, persistence (si aplica), scheduler/colas (proactividad).

---

## Estructura del repositorio

```
/openapi/                      # Contratos propios (YAML)
/schemas/capabilities/         # JSON Schemas (capabilities/tools)
/src/
  core/                        # Dominio (entidades, VOs, reglas)
  app/                         # Servicios/orquestación
  adapters/
    slack/                     # Bolt handlers (Socket Mode)
    mastra/                    # agents/, tools/, rag/
    integrations/              # jira/, linear/, google/, msft/, email/
    http/                      # API propia (si aplica)
  infra/
    config/                    # Zod para .env
    logging/                   # Pino/OpenTelemetry (opcional)
    scheduler/                 # Timers/Jobs (proactividad)
  shared/                      # Tipos, Result/Either, utilidades
/tests/
  unit/
  integration/
  contract/                    # Validación de OpenAPI + Schemas
.github/workflows/             # CI
.devcontainer/                 # Codespaces
docs/                          # Guías (Slack, ADRs)
```

---

## Requisitos

- **Node.js 20+**, **npm**.  
- **Mastra** local (creado con `npx create-mastra@latest` y agente `pulsedesk`).  
- **Slack**: acceso para crear una app en tu workspace (o coordinar con un admin).

(Para `Codespaces`, el devcontainer usa `typescript-node:20`.)

---

## Variables de entorno

Crear `.env` a partir de `.env.example`:

| Variable               | Descripción                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| `SLACK_APP_TOKEN`      | Token **app-level** (`xapp-…`) con scope `connections:write` (Socket Mode).|
| `SLACK_BOT_TOKEN`      | Token **bot** (`xoxb-…`) con scopes `app_mentions:read`, `chat:write`.     |
| `SLACK_SIGNING_SECRET` | Signing secret de la app de Slack.                                          |
| `MASTRA_BASE_URL`      | URL del dev server de Mastra (p. ej. `http://localhost:4111`).             |
| `MASTRA_AGENT_ID`      | ID del agente de Mastra (por defecto `pulsedesk`).                         |

> La carga/validación se hace con **Zod** en `src/infra/config/env.ts`.

---

## Guía rápida (hola mundo Slack ↔ Mastra)

1) **Arranca Mastra** (en el proyecto Mastra):  
```bash
npm run dev
# Playground/API: http://localhost:4111
```

2) **Arranca el puente Slack** (en este repo):  
```bash
npm run dev:slack
```

3) **Prueba en Slack:** en un canal, menciona `@PulseDesk hola`.  
El puente llamará a `POST /api/agents/{MASTRA_AGENT_ID}/generate` y responderá con el texto devuelto por el agente.

---

## Integración con Slack (Socket Mode)

1. Crear app en <https://api.slack.com/apps> (**From scratch**, nombre: *PulseDesk*).  
2. **Basic Information → App-Level Tokens** → crear token con scope `connections:write` → copiar **`xapp-…`**.  
3. **OAuth & Permissions → Scopes (Bot Token)** → añadir `app_mentions:read` y `chat:write`.  
   Instalar la app en el workspace → copiar **`xoxb-…`**.  
4. **Basic Information** → copiar **Signing Secret**.  
5. **Socket Mode**: activar (ON).  
6. **Event Subscriptions (Bot Events)**: añadir `app_mention`.  
7. Completar `.env` y ejecutar `npm run dev:slack`.

> Para producción puedes mantener Socket Mode o migrar a Events API con URL pública.

---

## Spec-Driven Development (cómo trabajamos)

**Flujo por PR:**
1. **Issue** con objetivo, request/response, errores 400/422, criterios de aceptación.  
2. **PR de specs + tests** (solo):  
   - Edita `openapi/openapi.yaml` y/o `schemas/capabilities/*.schema.json`.  
   - Actualiza/añade tests en `tests/contract` (Vitest + Ajv + Swagger-Parser).  
   - CI debe pasar (verde).  
3. **PR de implementación mínima** (después de aprobar contratos).  

**Herramientas útiles:**
- Validación: **Ajv**, **Swagger-Parser** (OpenAPI 3.x).  
- Lint opcional: **Spectral** (OpenAPI).  
- Opcional: **Spec Kit (`./specify`)** para co-crear/editar specs desde la CLI.

---

## Calidad: tests, CI y normas

- **Piramide de tests:** unit > integración > E2E.  
- **Contract tests:** OpenAPI válido + Schemas válidos (con ejemplos válidos e inválidos).  
- **Cobertura objetivo:** ≥ **80%** en `src/core` y `src/app`.  
- **CI (GitHub Actions):** Node 20, `npm ci`, `npm test`.  
- **Normas de PR:**
  - Commits convencionales (`spec:`, `feat:`, `fix:`, `test:`, `docs:`, `chore:`).  
  - **Todos los tests deben pasar** y **branch protection** en `main`.  
  - No subir secretos; `.env.example` obligatorio cuando se requieran nuevas variables.

---

## Roadmap

**P0 (este PR):**
- [ ] OpenAPI (health + bridge/dispatch)  
- [ ] Schemas base (diagnostics.echo)  
- [ ] Tests de contrato + CI  
- [ ] Puente Slack (Socket Mode) ↔ Mastra (`pulsedesk`)  
- [ ] README + guía Slack

**P1:**
- [ ] Memoria persistente por usuario/hilo  
- [ ] RAG (KB) — ingesta, embeddings, búsqueda y citas  
- [ ] Capabilities: `kb.search`, `ticket.create`, `ticket.update`, `calendar.schedule`, `email.send`  
- [ ] Proactividad (timers SLA + webhooks de tickets)  
- [ ] Observabilidad (logs/metrics/traces)

**P2:**
- [ ] Multi-tenant y ACL  
- [ ] Aprobaciones/Flujos de negocio  
- [ ] Colas/Jobs y reintentos idempotentes  
- [ ] Dockerfile + despliegue (12-factor)  
- [ ] Dashboards y evaluación continua

---

## Seguridad y cumplimiento

- **Principio de mínimo privilegio** (scopes de Slack/Jira/Google).  
- **Secrets** solo en variables de entorno/secret store.  
- **PII**: redacción en logs y retención mínima.  
- **Trazabilidad**: auditoría de acciones/decisiones (según evolucione el MVP).

---

## Contribución

1. Crea un **Issue** con criterios de aceptación.  
2. Abre rama `spec/...` o `feat/...`.  
3. Sigue el flujo **SDD** (contratos → tests → implementación).  
4. Abre **PR** pequeño, en español, con checklist; espera revisión.  
5. Merge solo con **CI en verde**.

---

## Licencia
TBD.

---

### Comandos rápidos

```bash
# Instalar dependencias
npm i

# Tests (validación de OpenAPI + Schemas)
npm test

# Arrancar puente Slack (Socket Mode)
npm run dev:slack

# (En proyecto Mastra) levantar agente
npm run dev  # Playground/API en http://localhost:4111
```

> Si trabajas en **GitHub Codespaces**, abre un Codespace y usa los mismos comandos.  
> Si usas **GitHub Spaces (coding agent)**, agrega como Sources: `README.md`, `.specify/memory/constitution.md`, y las guías oficiales de Slack (Socket Mode, scopes, `app_mention`) para que el agente cree el PR automáticamente.