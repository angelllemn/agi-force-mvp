# AGI Force MVP - Docker Development Environment

Este directorio contiene la configuración de Docker para el entorno de desarrollo compartido de AGI Force MVP.

## 📁 Estructura

```
docker/
├── postgres/
│   └── init/
│       └── 01-init-database.sql    # Script de inicialización de DB
└── pgadmin/
    └── servers.json                # Configuración de pgAdmin
```

## 🚀 Inicio Rápido

### 1. Levantar todo el entorno:
```bash
docker-compose up -d
```

### 2. Ver logs:
```bash
docker-compose logs -f
```

### 3. Parar el entorno:
```bash
docker-compose down
```

## 🔧 Servicios Disponibles

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| **app** | 3000 | http://localhost:3000 | Aplicación AGI Force MVP |
| **postgres** | 5432 | localhost:5432 | Base de datos PostgreSQL 16 |
| **redis** | 6379 | localhost:6379 | Cache Redis |
| **pgadmin** | 8080 | http://localhost:8080 | Administrador de DB |

## 🗃️ Esquemas de Base de Datos

La base de datos `agi_force_mvp` está organizada en esquemas:

- **`context_persistence`**: Persistencia de contexto conversacional (Spec 001)
- **`user_management`**: Gestión de usuarios y autenticación
- **`agent_workflows`**: Workflows y configuración de agentes
- **`system_config`**: Configuración del sistema

## 🔐 Credenciales por Defecto

### PostgreSQL:
- **Usuario**: `agi_user`
- **Contraseña**: `agi_pass`
- **Base de datos**: `agi_force_mvp`

### pgAdmin:
- **Email**: `admin@agiforce.local`
- **Contraseña**: `admin123`

## 🔄 Comandos Útiles

### Reconstruir contenedores:
```bash
docker-compose build --no-cache
```

### Reiniciar solo la aplicación:
```bash
docker-compose restart app
```

### Entrar al contenedor de la aplicación:
```bash
docker-compose exec app bash
```

### Backup de base de datos:
```bash
docker-compose exec postgres pg_dump -U agi_user agi_force_mvp > backup.sql
```

### Restaurar backup:
```bash
docker-compose exec -T postgres psql -U agi_user agi_force_mvp < backup.sql
```

## 🛠️ Desarrollo

### Hot Reload:
El código fuente está montado como volumen, los cambios se reflejan automáticamente.

### Debugging:
Puerto 9229 expuesto para debugging con Node.js Inspector.

### Variables de Entorno:
Configurar en `.env` o `.env.local` según el entorno.

## 📦 Volúmenes Persistentes

- `postgres_data`: Datos de PostgreSQL
- `redis_data`: Datos de Redis
- `pgadmin_data`: Configuración de pgAdmin
- `npm_cache`: Cache de npm

## 🌐 Red

Todos los servicios se comunican a través de la red `agi-force-network`.

## ⚠️ Notas Importantes

1. **Primer arranque**: PostgreSQL puede tardar unos segundos en inicializarse
2. **Healthchecks**: Los servicios tienen healthchecks configurados
3. **Desarrollo**: Este setup es solo para desarrollo, no para producción