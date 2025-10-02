#!/usr/bin/env node

import { startSlackBridge } from './adapters/slack/bridge.js';

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Slack bridge...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Slack bridge...');
  process.exit(0);
});

// Start the bridge
startSlackBridge().catch((error: any) => {
  console.error('❌ Failed to start Slack bridge:', error);
  process.exit(1);
});