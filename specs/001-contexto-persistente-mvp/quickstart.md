# Quickstart: Contexto Persistente (MVP)

**Feature**: Sistema de contexto conversacional persistente para AGI Force bot
**Última actualización**: 2024-12-22

## 📋 Prerrequisitos

### Software requerido
- **Node.js** v20+ 
- **npm** v10+
- **Docker** y **Docker Compose** (para base de datos)
- **Git** (para control de versiones)

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

# Cambiar a la rama de desarrollo
git checkout 001-contexto-persistente-mvp

# Instalar dependencias
npm install
```

### 2. Configuración de base de datos

#### Opción A: PostgreSQL con Docker (Recomendado)
```bash
# Iniciar PostgreSQL con Docker Compose
docker-compose up -d postgres

# Verificar que está corriendo
docker ps | grep postgres
```

#### Opción B: SQLite para desarrollo local
```bash
# No requiere configuración adicional
# SQLite se creará automáticamente en ./data/context.db
```

### 3. Variables de entorno
```bash
# Copiar template de configuración
cp .env.example .env.local

# Editar configuración (usar tu editor preferido)
nano .env.local
```

**Configuración mínima requerida**:
```env
# Base de datos
DATABASE_URL=postgresql://context_user:context_pass@localhost:5432/context_db
# O para SQLite: DATABASE_URL=sqlite:./data/context.db

# Slack integration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Mastra configuration
MASTRA_API_URL=http://localhost:8000
MASTRA_API_KEY=your-mastra-key

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## 🏃‍♂️ Ejecución

### Desarrollo local
```bash
# Ejecutar migraciones de base de datos
npm run db:migrate

# Iniciar en modo desarrollo
npm run dev

# En otra terminal, iniciar el bot de Slack
npm run dev:slack
```

### Verificación de funcionamiento
```bash
# Verificar que los servicios responden
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/context/health

# Verificar conexión a base de datos
npm run db:status
```

## 🧪 Testing

### Ejecutar todas las pruebas
```bash
# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests de contratos (OpenAPI)
npm run test:contract

# Coverage completo
npm run test:coverage
```

### Tests específicos para contexto persistente
```bash
# Solo tests de contexto
npm run test -- --testPathPattern=context

# Tests de repository
npm run test -- --testPathPattern=repository

# Tests de casos de uso
npm run test -- --testPathPattern=use-case
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
    │   └── database.ts
    ├── persistence/
    │   ├── migrations/
    │   └── connection.ts
    └── logging/
        └── context-logger.ts
```

### Comandos útiles para desarrollo
```bash
# Regenerar tipos de base de datos
npm run db:generate-types

# Reset completo de base de datos
npm run db:reset

# Verificar cumplimiento constitucional
npm run constitution:check

# Linting y formato
npm run lint
npm run format

# Build para producción
npm run build
```

## 🐛 Debugging

### Logs estructurados
```bash
# Ver logs en tiempo real
npm run logs:follow

# Filtrar logs por correlationId
npm run logs:correlation <correlation-id>

# Ver logs de contexto específicamente
npm run logs:context
```

### Debugging de base de datos
```bash
# Conectar a PostgreSQL directamente
docker exec -it agi-force-postgres psql -U context_user -d context_db

# Ver esquema actual
npm run db:schema

# Ejecutar query específico
npm run db:query "SELECT * FROM conversation_contexts LIMIT 5;"
```

### Debugging de integración Slack
```bash
# Verificar webhook de Slack
npm run slack:verify-webhook

# Test de respuesta del bot
npm run slack:test-response

# Ver eventos de Slack en tiempo real
npm run slack:events:follow
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
docker ps | grep postgres

# Verificar conectividad
npm run db:ping

# Recrear base de datos
docker-compose down postgres
docker-compose up -d postgres
npm run db:migrate
```

#### Bot no responde en Slack
```bash
# Verificar configuración de Slack
npm run slack:verify-config

# Revisar logs de Slack adapter
npm run logs:slack

# Test de conectividad con Mastra
npm run mastra:health
```

#### Tests fallan
```bash
# Limpiar cache de Jest
npm run test:clear-cache

# Ejecutar tests con verbose
npm run test -- --verbose

# Ejecutar solo tests que fallan
npm run test -- --onlyFailures
```

## 📖 Documentación adicional

### Links útiles
- [Especificación completa](./spec.md)
- [Plan de implementación](./plan.md)
- [Modelo de datos](./data-model.md)
- [API Contracts](./contracts/)
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