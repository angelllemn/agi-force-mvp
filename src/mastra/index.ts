
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { pulseDeskAgent } from './agents/pulsedesk.js';
import { pulseDeskWorkflow } from './workflows/pulsedesk.js';

export const mastra = new Mastra({
  workflows: { pulseDeskWorkflow },
  agents: { pulseDeskAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
