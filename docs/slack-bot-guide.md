# Slack Bot Integration Guide

## 🤖 Guía de Integración del Bot de Slack con PulseDesk

Esta guía te mostrará cómo configurar y usar el bot de Slack integrado con tu arquitectura Mastra y PulseDesk.

## 📋 Prerrequisitos

1. **Cuenta de Slack y permisos de administrador** en el workspace
2. **Node.js 20+** instalado
3. **Tokens de Slack configurados** (ver sección de configuración)

## 🔧 Configuración Inicial

### 1. Crear una Slack App

1. Ve a [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click en "Create New App" → "From scratch"
3. Nombra tu app (ej: "PulseDesk Bot")
4. Selecciona tu workspace

### 2. Configurar Permisos

En la página de tu app, ve a **OAuth & Permissions** y añade estos scopes:

**Bot Token Scopes:**
- `app_mentions:read` - Para responder a menciones
- `channels:history` - Para leer historial de canales
- `chat:write` - Para enviar mensajes
- `im:history` - Para leer mensajes directos
- `groups:history` - Para grupos privados
- `assistant:write` - Para funciones de asistente (opcional)

### 3. Habilitar Socket Mode

1. Ve a **Socket Mode** en el sidebar
2. Activa **Enable Socket Mode**
3. Genera un **App-Level Token** con el scope `connections:write`

### 4. Configurar Event Subscriptions

1. Ve a **Event Subscriptions**
2. Activa **Enable Events**
3. Añade estos **Bot Events**:
   - `app_mention` - Para menciones
   - `message.channels` - Mensajes en canales
   - `message.groups` - Mensajes en grupos privados
   - `message.im` - Mensajes directos

### 5. Configurar Variables de Entorno

Copia tu archivo `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Edita `.env` con tus tokens:

```env
# Slack Configuration
SLACK_APP_TOKEN=xapp-1-XXXXX-XXXXX  # Token de nivel de app
SLACK_BOT_TOKEN=xoxb-XXXXX-XXXXX    # Bot User OAuth Token
SLACK_SIGNING_SECRET=your_secret     # Signing Secret

# Mastra Configuration
MASTRA_BASE_URL=http://localhost:4000
MASTRA_AGENT_ID=pulsedesk

# OpenAI (si usas el agente PulseDesk)
OPENAI_API_KEY=sk-xxxxx
```

## 🚀 Ejecutar el Bot

### Opción 1: Bot Básico
```bash
npm run slack:bot
```

### Opción 2: Bot Avanzado (con PulseDesk workflow)
```bash
npm run slack:advanced
```

## 💬 Usar el Bot

### Mensajes Directos
Envía un mensaje directo al bot:
```
Hola, ¿puedes ayudarme?
```

### Menciones en Canales
Menciona al bot en cualquier canal:
```
@pulsedesk necesito ayuda con un email
```

### Comando Slash (opcional)
Si configuras slash commands:
```
/pulse enviar email a juan@ejemplo.com
```

## 🔧 Funcionalidades

### 1. Respuestas Inteligentes
El bot analiza el intent de los mensajes:
- **Saludos**: Respuesta amigable
- **Solicitudes de ayuda**: Guía de comandos
- **Solicitudes de email**: Integración con workflow
- **Preguntas generales**: Respuestas contextuales

### 2. Interfaz Rica
- **Botones interactivos** para feedback
- **Blocks y formatting** para mejor UX
- **Threading** para conversaciones organizadas
- **Typing indicators** para mejor experiencia

### 3. Integración con PulseDesk
- Usa el **workflow de PulseDesk** existente
- **Análisis de intent** automático
- **Ejecución de acciones** (como enviar emails)
- **Seguimiento de conversaciones**

## 🛠️ Personalización

### Añadir Nuevos Comandos

En `src/bots/advanced-slack-bot.ts`, modifica el método `simulatePulseDeskWorkflow`:

```typescript
private async simulatePulseDeskWorkflow(input: any) {
  const message = input.userMessage.toLowerCase();
  
  // Añadir nuevo comando
  if (message.includes('crear tarea')) {
    return {
      response: '✅ Voy a crear una tarea para ti. ¿Cuál es el título?',
      actionTaken: 'Iniciando creación de tarea',
      needsFollowUp: true,
    };
  }
  
  // ... resto de la lógica
}
```

### Integrar con Workflow Real

Reemplaza `simulatePulseDeskWorkflow` con tu workflow real:

```typescript
// En lugar de simular, usa tu workflow real
const workflowResult = await this.mastra.runWorkflow('pulseDeskWorkflow', {
  userMessage: message,
  userId,
  channel: channelId,
});
```

### Añadir Botones Personalizados

```typescript
const blocks = [
  {
    type: 'section',
    text: { type: 'mrkdwn', text: 'Tu mensaje aquí' },
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Confirmar' },
        action_id: 'confirm_action',
        style: 'primary',
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Cancelar' },
        action_id: 'cancel_action',
        style: 'danger',
      },
    ],
  },
];
```

## 🔍 Debugging

### Logs del Bot
El bot muestra logs detallados:
```bash
📩 Mensaje recibido de <@U123>: hola
🧠 Procesando con PulseDesk workflow...
✅ Workflow completado: {...}
```

### Verificar Tokens
```bash
# Verificar formato de tokens
echo $SLACK_BOT_TOKEN | grep "^xoxb-"
echo $SLACK_APP_TOKEN | grep "^xapp-"
```

### Common Issues

1. **"Missing scope" error**: Añade los scopes necesarios en OAuth & Permissions
2. **"Socket connection failed"**: Verifica que Socket Mode esté habilitado
3. **"Invalid token"**: Regenera los tokens en la configuración de la app

## 🚀 Deployment

### Development
```bash
npm run slack:advanced
```

### Production con PM2
```bash
npm install -g pm2
pm2 start src/advanced-slack-bot.ts --name "pulsedesk-slack"
pm2 save
pm2 startup
```

### Docker (opcional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "slack:advanced"]
```

## 📚 API Reference

### SlackBot Class

#### Métodos Principales
- `start()`: Inicia el bot
- `stop()`: Detiene el bot
- `sendNotification(channelId, message)`: Envía notificación
- `sendRichMessage(channelId, title, content, actions)`: Envía mensaje con formato

#### Eventos Manejados
- `message`: Mensajes directos
- `app_mention`: Menciones del bot
- `button_click`: Clicks en botones
- `command`: Comandos slash

### Environment Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token | `xoxb-123...` |
| `SLACK_APP_TOKEN` | App-Level Token | `xapp-1-123...` |
| `SLACK_SIGNING_SECRET` | Signing Secret | `abc123...` |
| `MASTRA_BASE_URL` | URL base de Mastra | `http://localhost:4000` |
| `MASTRA_AGENT_ID` | ID del agente | `pulsedesk` |

## 🤝 Contributing

1. Fork el proyecto
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 License

Este proyecto está bajo la licencia [tu licencia aquí].