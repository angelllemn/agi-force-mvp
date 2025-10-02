// @ts-ignore
import pkg from '@slack/bolt';
import { validateEnv } from '../../infra/config/env.js';
import { MastraAgentResponse } from '../../types/mastra-api.js';
const { App } = pkg;

const env = validateEnv();

export const slackApp = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true,
  signingSecret: env.SLACK_SIGNING_SECRET,
});

// Verificación de conexión Socket Mode
async function verifySlackConnection(): Promise<boolean> {
  try {
    console.log('🔍 Verifying Slack connection...');

    // Verificar autenticación usando auth.test
    const authResult = await slackApp.client.auth.test();

    if (authResult.ok) {
      console.log('✅ Slack authentication successful:');
      console.log(`   • Bot User ID: ${authResult.user_id}`);
      console.log(`   • Bot Name: ${authResult.user}`);
      console.log(`   • Team: ${authResult.team}`);
      console.log(`   • URL: ${authResult.url}`);
      return true;
    } else {
      console.error('❌ Slack authentication failed:', authResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying Slack connection:', error);
    return false;
  }
}

// Configurar listeners de eventos de Socket Mode
function setupSocketModeListeners() {
  // Nota: Los eventos específicos de socket_mode no están expuestos directamente
  // pero podemos usar eventos de error y capturar estados de conexión

  slackApp.error(async (error) => {
    console.error('❌ Slack App error occurred:', error);

    // Verificar si es un error relacionado con Socket Mode
    const errorMessage = error.message || '';
    if (errorMessage.includes('socket') || errorMessage.includes('connection')) {
      console.error('   • Socket Mode connection issue detected');
      console.error('   • Check your app token and network connection');
    }
  });

  console.log('🔧 Socket Mode event listeners configured');
}

// Función para verificar el estado de salud de la conexión
async function performHealthCheck(): Promise<void> {
  try {
    console.log('🏥 Performing connection health check...');

    // Usar auth.test para verificar que la conexión sigue activa
    const authResult = await slackApp.client.auth.test();

    if (authResult.ok) {
      console.log('✅ Health check passed - Connection is healthy');
    } else {
      console.error('⚠️  Health check warning:', authResult.error);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

function stripBotMention(text = '', botUserId?: string): string {
  if (!text) return '';
  if (botUserId) {
    const mentionRegex = new RegExp(`<@${botUserId}>\\s*`, 'gi');
    return text.replace(mentionRegex, '').trim();
  }
  return text.replace(/<@\w+>\s*/g, '').trim();
}

async function generateMastraReply(prompt: string): Promise<string> {
  console.log('🧠 Calling Mastra agent with text:', prompt);

  // Llamar a la API de Mastra `${env.MASTRA_BASE_URL}/api/agents/{agentName}/generate`
  const response = await fetch(`${env.MASTRA_BASE_URL}/api/agents/${env.MASTRA_AGENT_ID}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        prompt
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mastra API error ${response.status} ${response.statusText}`);
  }

  const data: MastraAgentResponse = await response.json();
  console.log("Steps: " + data.steps)
  console.log("Respuesta: " + data.steps[0].text)

  return data.steps[0].text ? data.steps[0].text : 'Lo siento, no pude generar una respuesta.';
}

async function respondToUserPrompt({
  rawText,
  say,
  botUserId,
  threadTs,
}: {
  rawText: string | undefined;
  say: any; // Tipo any para manejar SayFn correctamente
  botUserId?: string;
  threadTs?: string;
}) {
  const cleanText = stripBotMention(rawText, botUserId);

  if (!cleanText) {
    await say({ text: '¡Hola! ¿En qué puedo ayudarte?', thread_ts: threadTs });
    return;
  }

  try {
    const replyText = await generateMastraReply(cleanText);
    await say({ text: replyText, thread_ts: threadTs });
  } catch (error) {
    console.error('❌ Error calling Mastra:', error);
    await say({
      text: 'Lo siento, ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.',
      thread_ts: threadTs,
    });
  }
}

// Listen for app mentions in channels and groups
slackApp.event('app_mention', async ({ event, say, context }) => {
  console.log('📩 Received app mention:', { channel: event.channel, user: event.user, text: event.text });
  await respondToUserPrompt({
    rawText: event.text,
    say,
    botUserId: context.botUserId,
    threadTs: event.thread_ts ?? event.ts,
  });
});

// Listen for direct messages
slackApp.message(async ({ message, say, context, event }) => {
  // Ignore bot messages and non-user generated events
  if (!('text' in message) || message.subtype || message.bot_id) {
    return;
  }

  const channelType = (event as any).channel_type;
  if (channelType !== 'im') {
    return;
  }

  const dmMessage = message as any;
  const threadTs = dmMessage.thread_ts ?? dmMessage.ts;

  console.log('📥 Received direct message:', { user: message.user, text: message.text });
  await respondToUserPrompt({
    rawText: message.text,
    say,
    botUserId: context.botUserId,
    threadTs,
  });
});

export async function startSlackBridge() {
  console.log('🚀 Starting Slack bridge...');

  try {
    // Configurar listeners de eventos antes de iniciar
    setupSocketModeListeners();

    // Verificar conexión antes de iniciar Socket Mode
    const isConnectionValid = await verifySlackConnection();
    if (!isConnectionValid) {
      throw new Error('Failed to verify Slack connection');
    }

    // Iniciar la aplicación Slack
    await slackApp.start();

    console.log('⚡️ Slack bridge is running!');
    console.log(`🔗 Mastra Agent URL: ${env.MASTRA_BASE_URL}/api/agents/${env.MASTRA_AGENT_ID}/generate`);
    console.log('📱 Try mentioning the bot in Slack o envíale un DM.');
    console.log('🔗 Socket Mode connection established and verified');

    // Realizar un health check inicial después del inicio
    setTimeout(async () => {
      await performHealthCheck();
    }, 5000); // 5 segundos después del inicio

    // Configurar health checks periódicos (cada 5 minutos)
    setInterval(async () => {
      await performHealthCheck();
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('❌ Failed to start Slack bridge:', error);

    // Información adicional para debugging
    console.error('💡 Troubleshooting tips:');
    console.error('   • Verify SLACK_APP_TOKEN starts with "xapp-"');
    console.error('   • Verify SLACK_BOT_TOKEN starts with "xoxb-"');
    console.error('   • Check that Socket Mode is enabled in your Slack app');
    console.error('   • Ensure the app is installed in your workspace');
    console.error('   • Verify network connectivity');

    process.exit(1);
  }
}
