import { Mastra } from '@mastra/core';
import { createRequire } from 'module';
import { validateEnv } from '../infra/config/env.js';
import { pulseDeskWorkflow } from '../mastra/workflows/pulsedesk.js';
const require = createRequire(import.meta.url);
const { App, LogLevel } = require('@slack/bolt');

export class AdvancedSlackBot {
  private app: any;
  private env: ReturnType<typeof validateEnv>;
  private mastra!: Mastra;

  constructor() {
    this.env = validateEnv();
    
    // Inicializar la aplicación Slack Bolt en Socket Mode
    this.app = new App({
      token: this.env.SLACK_BOT_TOKEN,
      signingSecret: this.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: this.env.SLACK_APP_TOKEN,
      logLevel: LogLevel.DEBUG,
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    });

    this.setupMastra();
    this.setupEventHandlers();
  }

  private setupMastra() {
    this.mastra = new Mastra({
      workflows: {
        pulseDeskWorkflow
      },
    });
  }

  private setupEventHandlers() {
    // Middleware para filtrar mensajes de bots
    const noBotMessages = async ({ message, next }: any) => {
      if (!message.bot_id) {
        await next();
      }
    };

    // Escuchar mensajes directos al bot
    this.app.message(noBotMessages, async ({ message, say, client }) => {
      try {
        if (message.subtype !== undefined && 
            message.subtype !== 'file_share' && 
            message.subtype !== 'thread_broadcast') {
          return;
        }

        const userMessage = (message as any).text || '';
        const userId = (message as any).user || '';
        const channelId = (message as any).channel || '';

        console.log(`📩 Mensaje recibido de <@${userId}>: ${userMessage}`);

        // Procesar con PulseDesk workflow
        const result = await this.processWithPulseDeskWorkflow(
          userMessage, 
          userId, 
          channelId
        );

        // Responder con formato avanzado
        await this.sendAdvancedResponse(say, result, userId);

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        await say({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '⚠️ Lo siento, ocurrió un error procesando tu mensaje. Por favor intenta de nuevo.',
              },
            },
          ],
        });
      }
    });

    // Escuchar menciones al bot con threading
    this.app.event('app_mention', async ({ event, say, client }) => {
      try {
        const userMessage = this.stripBotMention(event.text || '');
        const userId = event.user || '';
        const channelId = event.channel || '';

        console.log(`👋 Mencionado por <@${userId}> en #${channelId}: ${userMessage}`);

        const result = await this.processWithPulseDeskWorkflow(
          userMessage, 
          userId, 
          channelId
        );

        await say({
          text: `<@${userId}> ${result.response}`,
          thread_ts: event.ts, // Responder en hilo
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `<@${userId}> ${result.response}`,
              },
            },
            ...(result.actionTaken ? [{
              type: 'context' as const,
              elements: [{
                type: 'mrkdwn' as const,
                text: `💡 _Acción realizada: ${result.actionTaken}_`,
              }],
            }] : []),
          ],
        });

      } catch (error) {
        console.error('❌ Error procesando mención:', error);
        await say(`<@${event.user}> Lo siento, ocurrió un error. Por favor intenta de nuevo.`);
      }
    });

    // Comando slash con respuestas interactivas
    this.app.command('/pulse', async ({ command, ack, respond, client }) => {
      await ack();

      try {
        const result = await this.processWithPulseDeskWorkflow(
          command.text || '', 
          command.user_id || '', 
          command.channel_id || ''
        );

        await respond({
          response_type: 'in_channel',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: result.response,
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `🤖 PulseDesk AI Assistant | Solicitado por <@${command.user_id}>`,
                },
              ],
            },
            ...(result.needsFollowUp ? [{
              type: 'actions' as const,
              elements: [{
                type: 'button' as const,
                text: {
                  type: 'plain_text' as const,
                  text: '💬 Continuar conversación',
                },
                action_id: 'continue_conversation',
                value: JSON.stringify({
                  originalMessage: command.text,
                  userId: command.user_id,
                }),
              }],
            }] : []),
          ],
        });

      } catch (error) {
        console.error('❌ Error procesando comando:', error);
        await respond({
          text: 'Error procesando el comando. Intenta de nuevo.',
          response_type: 'ephemeral',
        });
      }
    });

    // Manejo de botones interactivos
    this.app.action('continue_conversation', async ({ body, ack, respond }) => {
      await ack();

      try {
        const payload = JSON.parse((body as any).actions[0].value);
        
        await respond({
          text: `¡Perfecto! Continúo ayudándote con: "${payload.originalMessage}". ¿Qué más necesitas?`,
          response_type: 'in_channel',
        });

      } catch (error) {
        console.error('Error manejando botón:', error);
      }
    });

    // Manejo de errores globales
    this.app.error(async (error) => {
      console.error('🚨 Error global en Slack Bot:', error);
    });
  }

  private stripBotMention(text: string): string {
    return text.replace(/<@[UW][A-Z0-9]+>/g, '').trim();
  }

  private async processWithPulseDeskWorkflow(
    message: string, 
    userId: string, 
    channelId: string
  ): Promise<{ response: string; actionTaken?: string; needsFollowUp: boolean }> {
    try {
      console.log('🧠 Procesando con PulseDesk workflow...');

      // Simular llamada al workflow - reemplaza con tu implementación real
      const workflowResult = await this.simulatePulseDeskWorkflow({
        userMessage: message,
        userId,
        channel: channelId,
      });

      console.log('✅ Workflow completado:', workflowResult);

      return {
        response: workflowResult.response || 'No pude generar una respuesta.',
        actionTaken: workflowResult.actionTaken,
        needsFollowUp: workflowResult.needsFollowUp || false,
      };

    } catch (error) {
      console.error('Error ejecutando PulseDesk workflow:', error);
      
      // Fallback response
      return {
        response: this.generateFallbackResponse(message),
        needsFollowUp: false,
      };
    }
  }

  private async simulatePulseDeskWorkflow(input: any) {
    // Esta es una simulación - reemplaza con tu workflow real
    const message = input.userMessage.toLowerCase();
    
    if (message.includes('email')) {
      return {
        response: '📧 ¡Perfecto! Puedo ayudarte con tareas de email. ¿Qué necesitas enviar?',
        actionTaken: 'Detectado intent de email',
        needsFollowUp: true,
      };
    }
    
    if (message.includes('hola') || message.includes('hello')) {
      return {
        response: '¡Hola! 👋 Soy PulseDesk, tu asistente conversacional. ¿En qué puedo ayudarte?',
        actionTaken: 'Saludo procesado',
        needsFollowUp: false,
      };
    }

    return {
      response: `Procesé tu mensaje: "${input.userMessage}". ¿Cómo puedo ayudarte específicamente?`,
      actionTaken: 'Mensaje general procesado',
      needsFollowUp: true,
    };
  }

  private async sendAdvancedResponse(
    say: any, 
    result: { response: string; actionTaken?: string; needsFollowUp: boolean },
    userId: string
  ) {
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: result.response,
        },
      },
    ];

    if (result.actionTaken) {
      blocks.push({
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `✅ _${result.actionTaken}_`,
        }],
      });
    }

    if (result.needsFollowUp) {
      blocks.push(
        { 
          type: 'divider' 
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '👍 Fue útil',
              },
              action_id: 'feedback_positive',
              style: 'primary',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '👎 Necesito más ayuda',
              },
              action_id: 'feedback_negative',
            },
          ],
        }
      );
    }

    await say({ blocks });
  }

  private generateFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('hello')) {
      return '¡Hola! 👋 Soy PulseDesk, tu asistente conversacional. ¿En qué puedo ayudarte hoy?';
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
      return `🆘 *Estoy aquí para ayudarte*

• Pregúntame cualquier cosa
• Puedo ayudarte con emails y tareas
• Usa \`/pulse [mensaje]\` para comandos rápidos
• Mencióname con @pulsedesk en canales

¿Qué necesitas?`;
    }

    return `Recibí tu mensaje: "${message}". Estoy procesando tu solicitud. ¿Podrías ser más específico sobre cómo puedo ayudarte?`;
  }

  public async start(): Promise<void> {
    try {
      await this.app.start();
      console.log('⚡️ PulseDesk SlackBot avanzado está ejecutándose!');
      console.log(`🔗 Conectado como: ${this.env.MASTRA_AGENT_ID}`);
      console.log('🤖 Con integración completa PulseDesk workflow');
      console.log('📱 Listo para recibir mensajes...');
    } catch (error) {
      console.error('❌ Error iniciando SlackBot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.app.stop();
      console.log('🛑 SlackBot detenido');
    } catch (error) {
      console.error('❌ Error deteniendo SlackBot:', error);
      throw error;
    }
  }

  // Métodos para integración avanzada
  public async sendNotification(channelId: string, message: string): Promise<void> {
    try {
      await this.app.client.chat.postMessage({
        channel: channelId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🔔 *Notificación PulseDesk*\n\n${message}`,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error enviando notificación:', error);
      throw error;
    }
  }

  public async sendRichMessage(
    channelId: string, 
    title: string, 
    content: string, 
    actions?: Array<{ text: string; action_id: string; style?: 'primary' | 'danger' }>
  ): Promise<void> {
    try {
      const blocks: any[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: content,
          },
        },
      ];

      if (actions && actions.length > 0) {
        blocks.push({
          type: 'actions',
          elements: actions.map(action => ({
            type: 'button',
            text: {
              type: 'plain_text',
              text: action.text,
            },
            action_id: action.action_id,
            ...(action.style && { style: action.style }),
          })),
        });
      }

      await this.app.client.chat.postMessage({
        channel: channelId,
        blocks,
      });
    } catch (error) {
      console.error('Error enviando mensaje rico:', error);
      throw error;
    }
  }
}