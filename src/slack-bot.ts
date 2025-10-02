#!/usr/bin/env node

import { SlackBot } from './bots/slack-bot.js';

async function main() {
  try {
    console.log('🚀 Iniciando PulseDesk SlackBot...');
    
    const bot = new SlackBot();
    
    // Manejo de señales para shutdown elegante
    process.on('SIGINT', async () => {
      console.log('\n⏸️  Recibida señal SIGINT, cerrando bot...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n⏸️  Recibida señal SIGTERM, cerrando bot...');
      await bot.stop();
      process.exit(0);
    });

    // Iniciar el bot
    await bot.start();
    
  } catch (error) {
    console.error('💥 Error fatal iniciando SlackBot:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  main();
}

export { SlackBot };
