import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * Mock email tool that logs email sending attempts
 * This is a test implementation that doesn't actually send emails
 */
export const sendTestEmailTool = createTool({
  id: 'send_test_email',
  description: 'Send a test email (mock implementation - logs only)',
  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body content'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the email was sent successfully'),
    messageId: z.string().describe('Mock message ID'),
    timestamp: z.string().describe('Timestamp when email was processed'),
  }),
  execute: async ({ context }) => {
    const { to, subject, body } = context;
    
    console.log('📧 MOCK EMAIL TOOL - Email send attempt:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
    // Simulate email sending with mock response
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    };
  },
});