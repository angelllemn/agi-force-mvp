# Quickstart: Contexto Persistente (MVP)

**Feature**: Sistema de contexto conversacional persistente para AGI Force bot
**Última actualización**: 2025-10-08

## 📋 Prerrequisitos

### Software requerido

- **Node.js** v20+
- **npm** v10+
- **Docker** y **Docker Compose** (para base de datos)
- **Git** (para control de versiones)
- **Prisma CLI** (`npx prisma`) instalado vía `npm install -D prisma` (se ejecuta automáticamente al instalar dependencias)

### Verificación del entorno

```bash
node --version    # Debe ser v20.x.x o superior
npm --version     # Debe ser v10.x.x o superior
docker --version  # Cualquier versión reciente
```

## 🚀 Instalación y configuración

### 1. Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone https://github.com/angelllemn/agi-force-mvp.git
cd agi-force-mvp

# Instalar dependencias (incluye Prisma CLI y cliente)
npm install
```

### 2. Configuración de base de datos

#### Opción A: PostgreSQL con Docker (Recomendado)

```bash
# Iniciar PostgreSQL con Docker Compose
docker compose up -d postgres

# Verificar que está corriendo
docker ps | grep postgres
```

#### Opción B: SQLite para desarrollo local

```bash
# No requiere configuración adicional
# Prisma generará context.db en ./data/context.db al aplicar migraciones
```

### 3. Variables de entorno

```bash
# Copiar template de configuración
cp .env.example .env

# Opcional: perfiles locales o de test
cp .env.example .env.local    # Sobrescribe valores para tu máquina
cp .env.example .env.test     # Variables específicas para suites de pruebas

# Editar configuración (usar tu editor preferido)
nano .env
```

**Configuración mínima requerida**:

```env
# Driver de persistencia disponible: memory | postgres | sqlite
PERSISTENCE_DRIVER=postgres

# Base de datos (PostgreSQL por defecto)
DATABASE_URL=postgresql://agi_user:agi_pass@localhost:5432/agi_force_mvp
# O para SQLite (modo offline)
# PERSISTENCE_DRIVER=sqlite
# DATABASE_URL=file:./data/context.db

# URL dedicada para pruebas automatizadas (opcional)
# TEST_DATABASE_URL=postgresql://agi_test:agi_test@localhost:5433/agi_force_mvp_test

PRISMA_LOG_LEVEL=error

# Slack integration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Mastra configuration
MASTRA_BASE_URL=http://localhost:4111
MASTRA_AGENT_ID=pulseDeskAgent

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## 🏃‍♂️ Ejecución

### Desarrollo local

```bash
# Aplicar migraciones Prisma (genera base de datos y cliente)
npm run db:migrate:dev
npm run db:generate

# Iniciar en modo desarrollo
npm run dev

# En otra terminal, iniciar el bot de Slack
npm run dev:slack
```

### Verificación de funcionamiento

```bash
# Verificar que el servicio responde
curl http://localhost:3000/health || true

# Verificar conexión a base de datos (Prisma)
npm run db:generate && echo "Prisma puede conectar"
```

## 🧪 Testing

### Ejecutar todas las pruebas

```bash
# Suite completa (Vitest)
npm test

# Vitest levanta automáticamente PostgreSQL vía Testcontainers (requiere Docker)

# Escenarios Spec Kit (Gherkin)
npm run spec:check

# Ejecutar un archivo específico
npm test -- tests/integration/user-context.test.ts
```

### Tests específicos para contexto persistente

```bash
# Filtrar por entidad o caso de uso
npm test -- --grep "ConversationContext"

# Ejecutar escenarios Spec Kit de DM
npm run spec:check -- --tags @dm

# Ejecutar pruebas de contrato
npm test -- tests/specs.test.ts
```

## 🔧 Desarrollo

### Estructura del proyecto (contexto persistente)

```
src/
├── core/
│   ├── entities/
│   │   ├── ConversationContext.ts
│   │   └── Message.ts
│   ├── ports/
│   │   ├── ConversationRepository.ts
│   │   └── ContextRetrievalService.ts
│   ├── use-cases/
│   │   ├── CreateContextUseCase.ts
│   │   ├── AddMessageUseCase.ts
│   │   └── RetrieveContextUseCase.ts
│   └── errors/
│       └── ContextErrors.ts
├── adapters/
│   ├── postgres/
│   │   └── PostgresConversationRepository.ts
│   ├── memory/
│   │   └── InMemoryConversationRepository.ts
│   └── slack/
│       └── SlackContextIntegration.ts
└── infra/
  ├── config/
  │   └── env.ts
  └── mastra/
    └── ... (agentes, herramientas, workflows)

prisma/
├── migrations/
└── schema.prisma
```

### Comandos útiles para desarrollo

```bash
# Aplicar migración nueva
npm run db:migrate:dev -- --name <descripcion>

# Generar cliente Prisma sin migrar
npm run db:generate

# Inspeccionar base de datos (PostgreSQL)
npm run db:studio

# Build para producción (Mastra)
npm run build
```

## 🐛 Debugging

### Debugging de base de datos

```bash
# Conectar a PostgreSQL directamente (requiere psql)
docker exec -it agi-force-mvp_devcontainer-postgres-1 psql -U agi_user -d agi_force_mvp

# Revisar contexto almacenado
SELECT c.id, c.type, c.expires_at, array_agg(p.participant) AS participants
FROM "ConversationContext" c
LEFT JOIN "ContextParticipant" p ON p."contextId" = c.id
GROUP BY c.id, c.type, c.expires_at;

# Revisar mensajes recientes
SELECT sender, content, timestamp FROM "ConversationMessage" ORDER BY timestamp DESC LIMIT 10;
```

## 📚 Casos de uso comunes

### 1. Crear contexto para usuario

```bash
curl -X POST http://localhost:3000/api/v1/context \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user",
    "participants": ["U1234567890"]
  }'
```

### 2. Agregar mensaje al contexto

```bash
curl -X POST http://localhost:3000/api/v1/context/{contextId}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "U1234567890",
    "content": "Hola, ¿cómo estás?",
    "timestamp": "2024-12-22T10:00:00Z"
  }'
```

### 3. Recuperar historial de conversación

```bash
curl "http://localhost:3000/api/v1/context?type=user&participants=U1234567890"
```

## 🚨 Troubleshooting

### Problemas comunes

#### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep agi-force-postgres

# Verificar conectividad
npx prisma db pull --force

# Recrear base de datos
docker compose down postgres
docker compose up -d postgres
npx prisma migrate reset
```

#### Tests fallan

```bash
# Ejecutar Vitest en modo interactivo
npm test -- --watch

# Con logs detallados
npm test -- --reporter verbose

# Repetir solo escenarios Spec Kit fallidos
npm run spec:check -- --last-failed
```

## 📖 Documentación adicional

### Links útiles

- [Especificación completa](./spec.md)
- [Plan de implementación](./plan.md)
- [Modelo de datos](./data-model.md)
- [API Contracts](./contracts/)
- [Contexto de investigación](./research.md)
- [Constitución del proyecto](../../.specify/memory/constitution.md)

### Recursos externos

- [Documentación de Mastra Framework](https://docs.mastra.ai)
- [Slack Bolt.js Documentation](https://slack.dev/bolt-js)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Soporte

### Reportar problemas

1. Revisar [issues existentes](https://github.com/angelllemn/agi-force-mvp/issues)
2. Crear nuevo issue con template apropiado
3. Incluir logs relevantes y pasos para reproducir

### Contacto del equipo

- **Tech Lead**: [Información de contacto]
- **Slack Channel**: #agi-force-development
- **Email**: dev-team@agi-force.com

---

**¡Feliz desarrollo! 🚀**
