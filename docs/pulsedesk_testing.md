# PulseDesk Agent - Guía de Pruebas Manuales

Esta guía te ayudará a probar el agente conversacional PulseDesk tanto directamente mediante API como a través de Slack.

## Prerrequisitos

1. **Variables de entorno configuradas** (copiar `.env.example` a `.env`):
   ```bash
   # Slack App Configuration
   SLACK_APP_TOKEN=xapp-your-app-level-token-here
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here

   # Mastra Configuration
   MASTRA_BASE_URL=http://localhost:4111
   MASTRA_AGENT_ID=pulsedesk

   # OpenAI Configuration (required for PulseDesk agent)
   OPENAI_API_KEY=your-openai-api-key-here
   ```

2. **Dependencias instaladas**:
   ```bash
   npm install
   ```

## Pruebas Directas del Agente (API)

### 1. Iniciar el servidor Mastra

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:4111`

### 2. Probar el agente con curl

#### Saludo básico:
```bash
curl -X POST http://localhost:4111/api/agents/pulsedesk/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hola"
      }
    ]
  }'
```

**Respuesta esperada**: Saludo amigable y presentación de capacidades.

#### Solicitud de ayuda:
```bash
curl -X POST http://localhost:4111/api/agents/pulsedesk/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Necesito ayuda"
      }
    ]
  }'
```

**Respuesta esperada**: Lista de capacidades disponibles.

#### Envío de email de prueba:
```bash
curl -X POST http://localhost:4111/api/agents/pulsedesk/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Envía un email de prueba a test@ejemplo.com"
      }
    ]
  }'
```

**Respuesta esperada**: Confirmación del envío del email con detalles como ID del mensaje y timestamp.

#### Pregunta general:
```bash
curl -X POST http://localhost:4111/api/agents/pulsedesk/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "¿Qué puedes hacer?"
      }
    ]
  }'
```

**Respuesta esperada**: Explicación detallada de capacidades.

## Pruebas a través de Slack

### 1. Configurar la integración de Slack

Sigue la guía en [docs/slack_integration.md](./slack_integration.md) para configurar la app de Slack.

### 2. Iniciar el puente de Slack

En una terminal separada (con el servidor Mastra ejecutándose):

```bash
npm run dev:slack
```

### 3. Probar en Slack

En tu workspace de Slack, menciona al bot:

#### Saludo:
```
@PulseDesk hola
```

#### Solicitud de ayuda:
```
@PulseDesk ayuda
```

#### Envío de email:
```
@PulseDesk envía un email de prueba a mi-email@ejemplo.com
```

#### Pregunta general:
```
@PulseDesk ¿qué hora es?
```

#### Despedida:
```
@PulseDesk adiós
```

## Verificaciones en los Logs

### Logs del servidor Mastra

Al ejecutar `npm run dev`, deberías ver:
- ✅ Servidor iniciado en puerto 4111
- ✅ Playground disponible en http://localhost:4111/
- ✅ API disponible en http://localhost:4111/api

### Logs del puente Slack

Al ejecutar `npm run dev:slack`, deberías ver:
- ✅ `🚀 Starting Slack bridge...`
- ✅ `⚡️ Slack bridge is running!`
- ✅ URL del agente Mastra mostrada

### Logs durante las pruebas

Para cada interacción, verifica en los logs:

1. **Análisis de intención**:
   ```
   🔍 Analyzing user intent for message: [mensaje del usuario]
   ```

2. **Generación de respuesta**:
   ```
   💬 Generating response for intent: [intención detectada]
   ```

3. **Envío de email (si aplica)**:
   ```
   📧 MOCK EMAIL TOOL - Email send attempt:
      To: [destinatario]
      Subject: [asunto]
      Body: [cuerpo]
      Timestamp: [timestamp]
   ```

4. **Actividad de Slack**:
   ```
   📩 Received app mention: [evento de Slack]
   🧠 Calling Mastra agent with text: [texto limpio]
   🤖 Mastra response: [respuesta del agente]
   ```

## Verificación de Funcionalidades

### ✅ Checklist de pruebas

- [ ] El servidor Mastra inicia correctamente
- [ ] El agente `pulsedesk` está registrado
- [ ] Las respuestas del agente son coherentes y en español
- [ ] El tool `send_test_email` registra correctamente los emails
- [ ] La integración de Slack funciona (si está configurada)
- [ ] Los logs muestran el flujo de procesamiento
- [ ] Las respuestas incluyen emojis y formato amigable
- [ ] El agente detecta correctamente diferentes intenciones

### ❌ Posibles errores

1. **Error 404 en API**: Verificar que el agente esté registrado en `src/mastra/index.ts`
2. **Error de OpenAI**: Verificar que `OPENAI_API_KEY` esté configurada
3. **Error de Slack**: Verificar tokens y configuración en `.env`
4. **Error de build**: Ejecutar `npm run build` para ver errores de TypeScript

## Estructura del Agente

El agente PulseDesk incluye:

- **Agent** (`src/mastra/agents/pulsedesk.ts`): Configuración del agente con instrucciones y herramientas
- **Workflow** (`src/mastra/workflows/pulsedesk.ts`): Flujo conversacional con análisis de intención
- **Tool** (`src/mastra/tools/email.ts`): Herramienta mock para envío de emails
- **Registro** (`src/mastra/index.ts`): Configuración en la instancia principal de Mastra

## Siguiente Pasos

Una vez que las pruebas manuales sean exitosas, considera:

1. Añadir pruebas automatizadas para el agente
2. Implementar persistencia de conversaciones
3. Añadir más herramientas (calendario, tickets, etc.)
4. Mejorar el análisis de intención con NLP más avanzado
5. Implementar manejo de contexto multi-turno