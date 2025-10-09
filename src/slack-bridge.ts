#!/usr/bin/env node

import { startSlackBridge } from './adapters/slack/bridge.js';
import type { AppContainer } from './infra/container/index.js';

let runtimeContainer: AppContainer | null = null;

async function shutdown(exitCode: number): Promise<void> {
  console.log('\n👋 Shutting down Slack bridge...');
  try {
    if (runtimeContainer) {
      await runtimeContainer.dispose();
      runtimeContainer = null;
    }
  } catch (error) {
    console.error('⚠️ Error while disposing container:', error);
  }
  process.exit(exitCode);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

async function main() {
  runtimeContainer = await startSlackBridge();
}

main().catch(async (error: any) => {
  console.error('❌ Failed to start Slack bridge:', error);
  await shutdown(1);
});