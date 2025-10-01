# PulseDesk — MVP (Mastra + Slack)

Agente de soporte para Slack con **contexto persistente**, **capabilities** (acciones) y **proactividad**.  
**Método de trabajo:** *Spec-Driven Development* (SDD) y documentación en **español**.

## Objetivo P0
Validar la integración Slack↔️Mastra con un “hola mundo” y asentar el marco SDD (OpenAPI + JSON Schemas + tests + CI). Luego escalar a PulseDesk (KB/RAG, tickets, recordatorios).

## Reglas SDD (no negociables)
1) **Especificaciones primero** (OpenAPI/JSON Schema).  
2) **Tests** de contrato después.  
3) **Implementación** al final (solo lo necesario para CI verde).  
Todo cambio en `openapi/` o `schemas/` debe traer tests.

## Estructura (inicial)
- `openapi/openapi.yaml` — contrato de endpoints propios del proyecto.
- `schemas/capabilities/` — JSON Schemas de capabilities (futuras tools).
- `tests/specs.test.ts` — tests de contrato (OpenAPI + Schemas).
- `.github/workflows/ci.yml` — CI que ejecuta los tests.

## Notas
- El servidor de Mastra expone `/openapi.json` y `/api/agents/{id}/generate` para pruebas locales.
- Para Slack usaremos **Socket Mode** en el hola mundo (sin URL pública).