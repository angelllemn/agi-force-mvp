import { Mastra } from '@mastra/core';
import { createRequire } from 'module';
import { validateEnv } from '../infra/config/env.js';
const require = createRequire(import.meta.url);
const { App, LogLevel } = require('@slack/bolt');

export class SlackBot {
  private app: any;
  private env: ReturnType<typeof validateEnv>;
  private mastra?: Mastra;

  constructor() {
    this.env = validateEnv();
    
    // Inicializar la aplicación Slack Bolt en Socket Mode
    this.app = new App({
      token: this.env.SLACK_BOT_TOKEN,
      signingSecret: this.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: this.env.SLACK_APP_TOKEN,
      logLevel: LogLevel.DEBUG,
      // No necesitamos puerto en Socket Mode, pero por si acaso OAuth
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    });

    this.setupMastra();
    this.setupEventHandlers();
  }

  private setupMastra() {
    // Configurar Mastra opcional - puedes personalizar según tu configuración
    try {
      this.mastra = new Mastra({
        agents: {},
        workflows: {},
      });
    } catch (error) {
      console.warn('⚠️  Mastra no configurado, usando respuestas básicas');
    }
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
        // Solo procesar mensajes de texto directo (no subtipos como file_share)
        if (message.subtype !== undefined && 
            message.subtype !== 'file_share' && 
            message.subtype !== 'thread_broadcast') {
          return;
        }

        const userMessage = (message as any).text || '';
        const userId = (message as any).user || '';
        const channelId = (message as any).channel || '';

        console.log(`📩 Mensaje recibido de ${userId}: ${userMessage}`);

        // Integrar con tu agente PulseDesk
        const response = await this.processWithMastra(userMessage, userId, channelId);

        // Responder en Slack
        await say({
          text: response,
          // Usar blocks para mejor formato si es necesario
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: response,
              },
            },
          ],
        });

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        await say('Lo siento, ocurrió un error procesando tu mensaje. Por favor intenta de nuevo.');
      }
    });

    // Escuchar menciones al bot (@bot_name)
    this.app.event('app_mention', async ({ event, say, client }) => {
      try {
        const userMessage = this.stripBotMention(event.text || '');
        const userId = event.user || '';
        const channelId = event.channel || '';

        console.log(`👋 Mencionado por ${userId} en ${channelId}: ${userMessage}`);

        const response = await this.processWithMastra(userMessage, userId, channelId);

        await say({
          text: `<@${userId}> ${response}`,
          thread_ts: event.ts, // Responder en hilo
        });

      } catch (error) {
        console.error('❌ Error procesando mención:', error);
        await say(`<@${event.user}> Lo siento, ocurrió un error. Por favor intenta de nuevo.`);
      }
    });

    // Escuchar comandos slash (opcional)
    this.app.command('/pulse', async ({ command, ack, respond }) => {
      await ack();

      try {
        const response = await this.processWithMastra(
          command.text || '', 
          command.user_id || '', 
          command.channel_id || ''
        );

        await respond({
          text: response,
          response_type: 'in_channel', // o 'ephemeral' para respuesta privada
        });
      } catch (error) {
        console.error('❌ Error procesando comando:', error);
        await respond('Error procesando el comando. Intenta de nuevo.');
      }
    });

    // Manejo de errores globales
    this.app.error(async (error) => {
      console.error('🚨 Error global en Slack Bot:', error);
    });
  }

  private stripBotMention(text: string): string {
    // Remover la mención del bot del texto
    return text.replace(/<@[UW][A-Z0-9]+>/g, '').trim();
  }

  private async processWithMastra(
    message: string, 
    userId: string, 
    channelId: string
  ): Promise<string> {
    try {
      // Aquí integrarías con tu workflow de PulseDesk
      // Por ahora simulo la respuesta, pero puedes usar tu agente real
      
      // Ejemplo básico de llamada a Mastra
      const context = {
        userMessage: message,
        userId,
        channelId,
        platform: 'slack',
      };

      // Si tienes un agente específico configurado:
      /*
      const agent = this.mastra.getAgent(this.env.MASTRA_AGENT_ID);
      const result = await agent.chat([{
        role: 'user',
        content: message,
      }], context);
      
      return result.text || 'No pude generar una respuesta.';
      */

      // Por ahora, respuesta básica mejorada
      return this.generateBasicResponse(message);
      
    } catch (error) {
      console.error('Error en procesamiento Mastra:', error);
      throw error;
    }
  }

  private generateBasicResponse(message: string): string {
    // Respuesta inteligente básica mientras configuras Mastra completamente
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('hello')) {
      return '¡Hola! 👋 Soy PulseDesk, tu asistente conversacional. ¿En qué puedo ayudarte hoy?';
    }
    
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
      return `🆘 *Comandos disponibles:*
• Pregúntame cualquier cosa y te ayudo
• Usa \`/pulse [tu mensaje]\` para comandos rápidos
• Mencióname con @pulsedesk para conversaciones en canales

¿Qué necesitas?`;
    }

    if (lowerMessage.includes('email') || lowerMessage.includes('correo')) {
      return '📧 Puedo ayudarte con tareas relacionadas a email. ¿Qué necesitas hacer?';
    }

    // Respuesta por defecto
    return `Recibí tu mensaje: "${message}". Estoy procesando tu solicitud con PulseDesk. ¿Podrías ser más específico sobre cómo puedo ayudarte?`;
  }

  public async start(): Promise<void> {
    try {
      await this.app.start();
      console.log('⚡️ SlackBot está ejecutándose en Socket Mode!');
      console.log(`🔗 Conectado como: ${this.env.MASTRA_AGENT_ID}`);
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

  // Métodos para integración avanzada con Mastra
  public async sendMessage(channelId: string, message: string): Promise<void> {
    try {
      await this.app.client.chat.postMessage({
        channel: channelId,
        text: message,
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  public async sendRichMessage(channelId: string, blocks: any[]): Promise<void> {
    try {
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