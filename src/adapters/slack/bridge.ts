// @ts-ignore
import pkg from '@slack/bolt';
import { validateEnv } from '../../infra/config/env.js';
const { App } = pkg;

const env = validateEnv();

export const slackApp = new App({
  token: env.SLACK_BOT_TOKEN,
  appToken: env.SLACK_APP_TOKEN,
  socketMode: true,
  signingSecret: env.SLACK_SIGNING_SECRET,
});

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

  const response = await fetch(`${env.MASTRA_BASE_URL}/api/agents/${env.MASTRA_AGENT_ID}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mastra API error ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('🤖 Mastra response:', data);

  return data.output_text || data.output?.text || 'Lo siento, no pude generar una respuesta.';
}

async function respondToUserPrompt({
  rawText,
  say,
  botUserId,
  threadTs,
}: {
  rawText: string | undefined;
  say: (message: any) => Promise<void>;
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
    await slackApp.start();
    console.log('⚡️ Slack bridge is running!');
    console.log(`🔗 Mastra Agent URL: ${env.MASTRA_BASE_URL}/api/agents/${env.MASTRA_AGENT_ID}/generate`);
    console.log('📱 Try mentioning the bot in Slack o envíale un DM.');
  } catch (error) {
    console.error('❌ Failed to start Slack bridge:', error);
    process.exit(1);
  }
}
