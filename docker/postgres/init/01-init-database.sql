-- Script de inicialización de la base de datos AGI Force MVP
-- Se ejecuta automáticamente cuando se crea el contenedor PostgreSQL

-- Crear esquemas para organizar las funcionalidades por spec
CREATE SCHEMA IF NOT EXISTS context_persistence;
CREATE SCHEMA IF NOT EXISTS user_management;
CREATE SCHEMA IF NOT EXISTS agent_workflows;
CREATE SCHEMA IF NOT EXISTS system_config;

-- Comentarios de documentación
COMMENT ON SCHEMA context_persistence IS 'Esquema para la persistencia de contexto conversacional (Spec 001)';
COMMENT ON SCHEMA user_management IS 'Esquema para gestión de usuarios y autenticación';
COMMENT ON SCHEMA agent_workflows IS 'Esquema para workflows y configuración de agentes';
COMMENT ON SCHEMA system_config IS 'Esquema para configuración del sistema';

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Configurar búsqueda de esquemas por defecto
ALTER DATABASE agi_force_mvp SET search_path TO context_persistence, user_management, agent_workflows, system_config, public;

-- Crear usuario para la aplicación con permisos específicos
-- (El usuario agi_user ya existe, solo ajustamos permisos)
GRANT USAGE ON SCHEMA context_persistence TO agi_user;
GRANT USAGE ON SCHEMA user_management TO agi_user;
GRANT USAGE ON SCHEMA agent_workflows TO agi_user;
GRANT USAGE ON SCHEMA system_config TO agi_user;

GRANT CREATE ON SCHEMA context_persistence TO agi_user;
GRANT CREATE ON SCHEMA user_management TO agi_user;
GRANT CREATE ON SCHEMA agent_workflows TO agi_user;
GRANT CREATE ON SCHEMA system_config TO agi_user;

-- Mensaje de confirmación
SELECT 'AGI Force MVP database initialized successfully!' AS status;