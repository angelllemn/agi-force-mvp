import { createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';
import { sendTestEmailTool } from '../tools/email.js';

// Input schema for the workflow
const pulseDeskInputSchema = z.object({
  userMessage: z.string().describe('User message to process'),
  userId: z.string().optional().describe('Optional user ID for context'),
  channel: z.string().optional().describe('Channel or context where message originated'),
});

// Output schema for the workflow
const pulseDeskOutputSchema = z.object({
  response: z.string().describe('Response message to send back to user'),
  actionTaken: z.string().optional().describe('Description of any action taken'),
  needsFollowUp: z.boolean().describe('Whether this conversation needs follow-up'),
});

// Step 1: Analyze user intent
const analyzeIntentStep = createStep({
  id: 'analyze_intent',
  description: 'Analyze user message to understand intent and extract context',
  inputSchema: z.object({
    userMessage: z.string(),
    userId: z.string().optional(),
    channel: z.string().optional(),
  }),
  outputSchema: z.object({
    intent: z.enum(['greeting', 'help_request', 'email_request', 'general_question', 'goodbye']),
    extractedInfo: z.object({
      emailTo: z.string().optional(),
      emailSubject: z.string().optional(),
      emailBody: z.string().optional(),
    }).optional(),
    context: z.string(),
  }),
  execute: async ({ context }) => {
    const { userMessage } = context.input;
    const message = userMessage.toLowerCase();
    
    console.log('🔍 Analyzing user intent for message:', userMessage);
    
    // Simple intent classification
    let intent: 'greeting' | 'help_request' | 'email_request' | 'general_question' | 'goodbye';
    let extractedInfo = {};
    
    if (message.includes('hola') || message.includes('hello') || message.includes('hi')) {
      intent = 'greeting';
    } else if (message.includes('help') || message.includes('ayuda') || message.includes('support') || message.includes('soporte')) {
      intent = 'help_request';
    } else if (message.includes('email') || message.includes('correo') || message.includes('send') || message.includes('enviar')) {
      intent = 'email_request';
      // Try to extract email information
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = userMessage.match(emailRegex);
      if (emails && emails.length > 0) {
        extractedInfo = { emailTo: emails[0] };
      }
    } else if (message.includes('bye') || message.includes('adiós') || message.includes('goodbye')) {
      intent = 'goodbye';
    } else {
      intent = 'general_question';
    }
    
    return {
      intent,
      extractedInfo: Object.keys(extractedInfo).length > 0 ? extractedInfo : undefined,
      context: `User ${context.input.userId || 'unknown'} from ${context.input.channel || 'unknown channel'} with intent: ${intent}`,
    };
  },
});

// Step 2: Generate appropriate response
const generateResponseStep = createStep({
  id: 'generate_response',
  description: 'Generate appropriate response based on user intent',
  inputSchema: z.object({
    intent: z.enum(['greeting', 'help_request', 'email_request', 'general_question', 'goodbye']),
    extractedInfo: z.object({
      emailTo: z.string().optional(),
      emailSubject: z.string().optional(),
      emailBody: z.string().optional(),
    }).optional(),
    context: z.string(),
    userMessage: z.string(),
  }),
  outputSchema: z.object({
    response: z.string(),
    shouldSendEmail: z.boolean(),
    emailData: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }).optional(),
    needsFollowUp: z.boolean(),
  }),
  execute: async ({ context }) => {
    const { intent, extractedInfo, userMessage } = context.input;
    
    console.log('💬 Generating response for intent:', intent);
    
    let response: string;
    let shouldSendEmail = false;
    let emailData;
    let needsFollowUp = false;
    
    switch (intent) {
      case 'greeting':
        response = '¡Hola! Soy PulseDesk, tu asistente conversacional. ¿En qué puedo ayudarte hoy? Puedo ayudarte con consultas generales, envío de emails de prueba, o cualquier pregunta que tengas.';
        needsFollowUp = true;
        break;
        
      case 'help_request':
        response = 'Estoy aquí para ayudarte. Estas son algunas cosas que puedo hacer:\n• Responder preguntas generales\n• Enviar emails de prueba\n• Mantener conversaciones naturales\n• Proporcionar asistencia técnica básica\n\n¿Hay algo específico en lo que necesites ayuda?';
        needsFollowUp = true;
        break;
        
      case 'email_request':
        if (extractedInfo?.emailTo) {
          shouldSendEmail = true;
          emailData = {
            to: extractedInfo.emailTo,
            subject: extractedInfo.emailSubject || 'Mensaje de PulseDesk',
            body: extractedInfo.emailBody || `Email de prueba enviado desde PulseDesk.\n\nMensaje original: "${userMessage}"\n\nEste es un email de prueba generado automáticamente.`,
          };
          response = `Perfecto, he preparado un email de prueba para ${extractedInfo.emailTo}. Procesando el envío...`;
        } else {
          response = 'Para enviar un email de prueba, necesito que me proporciones la dirección de destino. Por ejemplo: "Envía un email de prueba a ejemplo@dominio.com"';
          needsFollowUp = true;
        }
        break;
        
      case 'goodbye':
        response = '¡Hasta luego! Ha sido un placer ayudarte. No dudes en contactarme si necesitas algo más.';
        break;
        
      default:
        response = `Entiendo que tienes una consulta. Aunque no tengo una respuesta específica para "${userMessage}", estoy aquí para ayudarte con lo que necesites. ¿Podrías ser más específico sobre cómo puedo asistirte?`;
        needsFollowUp = true;
    }
    
    return {
      response,
      shouldSendEmail,
      emailData,
      needsFollowUp,
    };
  },
});

// Step 3: Execute email sending if needed
const executeEmailStep = createStep({
  id: 'execute_email',
  description: 'Send email if requested by user',
  inputSchema: z.object({
    shouldSendEmail: z.boolean(),
    emailData: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }).optional(),
    response: z.string(),
  }),
  outputSchema: z.object({
    finalResponse: z.string(),
    actionTaken: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const { shouldSendEmail, emailData, response } = context.input;
    
    if (!shouldSendEmail || !emailData) {
      return {
        finalResponse: response,
        actionTaken: undefined,
      };
    }
    
    console.log('📧 Executing email sending step');
    
    try {
      // Use the email tool
      const emailResult = await sendTestEmailTool.execute!({
        input: emailData,
        mastra,
      } as any);
      
      const finalResponse = `${response}\n\n✅ Email de prueba enviado exitosamente!\n📧 Destinatario: ${emailData.to}\n📝 Asunto: ${emailData.subject}\n🆔 ID del mensaje: ${emailResult.messageId}\n⏰ Enviado a las: ${emailResult.timestamp}`;
      
      return {
        finalResponse,
        actionTaken: `Email de prueba enviado a ${emailData.to}`,
      };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      
      const finalResponse = `${response}\n\n❌ Lo siento, hubo un error al enviar el email de prueba. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      return {
        finalResponse,
        actionTaken: `Error al enviar email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// Create the PulseDesk workflow
export const pulseDeskWorkflow = createWorkflow({
  id: 'pulsedesk-conversation',
  description: 'PulseDesk conversational workflow with email capabilities',
  inputSchema: pulseDeskInputSchema,
  outputSchema: pulseDeskOutputSchema,
  steps: [analyzeIntentStep, generateResponseStep, executeEmailStep],
  flow: [
    {
      step: 'analyze_intent',
      condition: () => true,
    },
    {
      step: 'generate_response',
      condition: () => true,
    },
    {
      step: 'execute_email',
      condition: () => true,
    },
  ],
});