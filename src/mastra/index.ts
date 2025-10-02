
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';

// Import PulseDesk components
import { pulseDeskAgent } from './agents/pulsedesk.js';
import { pulseDeskWorkflow } from './workflows/pulsedesk.js';

export const mastra = new Mastra({
  workflows: {
    'pulsedesk-conversation': pulseDeskWorkflow,
  },
  agents: {
    pulsedesk: pulseDeskAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
