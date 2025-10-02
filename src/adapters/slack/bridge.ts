// @ts-ignore
import pkg from '@slack/bolt';
const { App } = pkg;
import { validateEnv } from '../../infra/config/env.js';

const env = validateEnv();

export const slackApp = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true,
  signingSecret: env.SLACK_SIGNING_SECRET,
});

// Listen for app mentions
slackApp.event('app_mention', async ({ event, say }) => {
  try {
    console.log('📩 Received app mention:', event);
    
    // Clean the mention from the text (remove <@BOT_USER_ID> from beginning)
    const cleanText = event.text.replace(/<@\w+>\s*/, '').trim();
    
    if (!cleanText) {
      await say('¡Hola! ¿En qué puedo ayudarte?');
      return;
    }

    console.log('🧠 Calling Mastra agent with text:', cleanText);
    
    // Call Mastra agent
    const response = await fetch(`${env.MASTRA_BASE_URL}/api/agents/${env.MASTRA_AGENT_ID}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: cleanText,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('❌ Mastra API error:', response.status, response.statusText);
      await say('Lo siento, ocurrió un error al procesar tu mensaje. Inténtalo de nuevo.');
      return;
    }

    const data = await response.json();
    console.log('🤖 Mastra response:', data);
    
    // Extract response text
    const replyText = data.output_text || data.output?.text || 'Lo siento, no pude generar una respuesta.';
    
    await say(replyText);
    
  } catch (error) {
    console.error('❌ Error handling app mention:', error);
    await say('Lo siento, ocurrió un error. Inténtalo de nuevo más tarde.');
  }
});

export async function startSlackBridge() {
  console.log('🚀 Starting Slack bridge...');
  
  try {
    await slackApp.start();
    console.log('⚡️ Slack bridge is running!');
    console.log(`🔗 Mastra Agent URL: ${env.MASTRA_BASE_URL}/api/agents/${env.MASTRA_AGENT_ID}/generate`);
    console.log('📱 Try mentioning the bot in Slack: @PulseDesk hola');
  } catch (error) {
    console.error('❌ Failed to start Slack bridge:', error);
    process.exit(1);
  }
}