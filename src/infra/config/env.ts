import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

let envLoaded = false;

function applyEnvFile(envPath: string) {
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || key in process.env) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

function loadEnvFiles() {
  if (envLoaded) return;
  envLoaded = true;

  const cwd = process.cwd();
  const mode = process.env.NODE_ENV ?? 'development';

  const candidates = [
    `.env.${mode}.local`,
    '.env.local',
    `.env.${mode}`,
    '.env',
  ];

  const loaded = new Set<string>();

  for (const candidate of candidates) {
    if (loaded.has(candidate)) continue;
    loaded.add(candidate);

    const envPath = resolve(cwd, candidate);
    applyEnvFile(envPath);
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PERSISTENCE_DRIVER: z.enum(['memory', 'postgres', 'sqlite']).default('memory'),
    DATABASE_URL: z.string().optional(),
    TEST_DATABASE_URL: z.string().optional(),
    SLACK_APP_TOKEN: z.string().startsWith('xapp-', 'SLACK_APP_TOKEN must start with xapp-'),
    SLACK_BOT_TOKEN: z.string().startsWith('xoxb-', 'SLACK_BOT_TOKEN must start with xoxb-'),
    SLACK_SIGNING_SECRET: z.string().min(1, 'SLACK_SIGNING_SECRET is required'),
    MASTRA_BASE_URL: z.string().url('MASTRA_BASE_URL must be a valid URL'),
    MASTRA_AGENT_ID: z.string().default('pulsedesk'),
    PRISMA_LOG_LEVEL: z.enum(['query', 'info', 'warn', 'error', 'none']).default('error'),
  })
  .superRefine((env, ctx) => {
    const driver = env.PERSISTENCE_DRIVER;
    const databaseUrl = env.DATABASE_URL;

    const isPostgresUrl = (url: string) => url.startsWith('postgresql://');
    const isSqliteUrl = (url: string) => url.startsWith('file:');

    if (driver === 'postgres') {
      if (!databaseUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL is required when PERSISTENCE_DRIVER=postgres',
          path: ['DATABASE_URL'],
        });
      } else if (!isPostgresUrl(databaseUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL must start with postgresql:// when using postgres driver',
          path: ['DATABASE_URL'],
        });
      }
    }

    if (driver === 'sqlite') {
      if (!databaseUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL is required when PERSISTENCE_DRIVER=sqlite',
          path: ['DATABASE_URL'],
        });
      } else if (!isSqliteUrl(databaseUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL must start with file: when using sqlite driver',
          path: ['DATABASE_URL'],
        });
      }
    }

    if (env.TEST_DATABASE_URL) {
      const testUrl = env.TEST_DATABASE_URL;
      if (!isPostgresUrl(testUrl) && !isSqliteUrl(testUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TEST_DATABASE_URL must start with postgresql:// or file:',
          path: ['TEST_DATABASE_URL'],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  loadEnvFiles();

  const result = envSchema.safeParse(process.env);

  console.log('🔧 Validating environment variables...');

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');

  return result.data;
}
