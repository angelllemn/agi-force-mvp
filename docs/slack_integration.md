# Integración con Slack (Socket Mode)

Esta guía te ayudará a configurar la integración entre PulseDesk y Slack usando Socket Mode.

## 1. Crear la app en Slack

1. Ve a <https://api.slack.com/apps> y haz clic en **"Create New App"**
2. Selecciona **"From scratch"**
3. Nombre de la app: **`PulseDesk`**
4. Selecciona tu workspace de desarrollo

## 2. Configurar App-Level Token

1. Ve a **Basic Information → App-Level Tokens**
2. Haz clic en **"Generate Token and Scopes"**
3. Nombre del token: `pulsedesk-app-token`
4. Añade el scope: **`connections:write`**
5. Haz clic en **"Generate"**
6. **Copia el token `xapp-...`** (lo necesitarás para `SLACK_APP_TOKEN`)

## 3. Configurar Bot Token y Scopes

1. Ve a **OAuth & Permissions → Scopes → Bot Token Scopes**
2. Añade los siguientes scopes:
   - **`app_mentions:read`** - Para recibir menciones
   - **`chat:write`** - Para enviar respuestas
3. Haz clic en **"Install to Workspace"**
4. Autoriza la app
5. **Copia el Bot User OAuth Token `xoxb-...`** (lo necesitarás para `SLACK_BOT_TOKEN`)

## 4. Obtener Signing Secret

1. Ve a **Basic Information → App Credentials**
2. **Copia el Signing Secret** (lo necesitarás para `SLACK_SIGNING_SECRET`)

## 5. Activar Socket Mode

1. Ve a **Socket Mode**
2. **Activa Socket Mode** (toggle ON)

## 6. Configurar Event Subscriptions

1. Ve a **Event Subscriptions**
2. **Activa Events** (toggle ON)
3. En **Subscribe to bot events**, añade:
   - **`app_mention`**
4. Haz clic en **"Save Changes"**

## 7. Configurar variables de entorno

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Completa las variables con los valores obtenidos:
   ```bash
   # Slack App Configuration
   SLACK_APP_TOKEN=xapp-tu-token-app-level-aqui
   SLACK_BOT_TOKEN=xoxb-tu-bot-token-aqui
   SLACK_SIGNING_SECRET=tu-signing-secret-aqui

   # Mastra Configuration
   MASTRA_BASE_URL=http://localhost:4000
   MASTRA_AGENT_ID=pulsedesk
   ```

## 8. Probar la integración

1. **Inicia el servidor de desarrollo de Mastra:**
   ```bash
   npm run dev
   ```
   Esto iniciará Mastra en `http://localhost:4000`

2. **En otra terminal, inicia el puente Slack:**
   ```bash
   npm run dev:slack
   ```

3. **Prueba en Slack:**
   - Ve a tu workspace de Slack
   - En cualquier canal donde esté la app, menciona al bot:
     ```
     @PulseDesk hola
     ```
   - Deberías recibir una respuesta del agente

## Solución de problemas

### Error: "SLACK_APP_TOKEN must start with xapp-"
- Verifica que estés usando el **App-Level Token**, no el Bot Token
- El App-Level Token debe empezar con `xapp-`

### Error: "SLACK_BOT_TOKEN must start with xoxb-"
- Verifica que estés usando el **Bot User OAuth Token**
- El Bot Token debe empezar con `xoxb-`

### Error: "Failed to connect to Slack"
- Verifica que Socket Mode esté activado
- Verifica que todos los tokens sean correctos
- Asegúrate de que la app esté instalada en el workspace

### Error: "Failed to call Mastra agent"
- Verifica que Mastra esté corriendo en `http://localhost:4000`
- Verifica que el agente `pulsedesk` exista en Mastra
- Revisa los logs del servidor Mastra

## Migración a producción

Para producción, puedes:
1. **Mantener Socket Mode** - Más simple, funciona detrás de firewalls
2. **Migrar a Events API** - Requiere URL pública, más escalable

Para Events API necesitarás:
- Un servidor web público (no Socket Mode)
- Configurar Request URL en Event Subscriptions
- Implementar verificación de signatures HTTP