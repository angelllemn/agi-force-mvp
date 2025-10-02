import { z } from 'zod';

const envSchema = z.object({
  SLACK_APP_TOKEN: z.string().startsWith('xapp-', 'SLACK_APP_TOKEN must start with xapp-'),
  SLACK_BOT_TOKEN: z.string().startsWith('xoxb-', 'SLACK_BOT_TOKEN must start with xoxb-'),
  SLACK_SIGNING_SECRET: z.string().min(1, 'SLACK_SIGNING_SECRET is required'),
  MASTRA_BASE_URL: z.string().url('MASTRA_BASE_URL must be a valid URL'),
  MASTRA_AGENT_ID: z.string().default('pulsedesk'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  
  return result.data;
}