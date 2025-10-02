#!/usr/bin/env node

import { AdvancedSlackBot } from './bots/advanced-slack-bot.js';

async function main() {
  try {
    console.log('🚀 Iniciando PulseDesk Advanced SlackBot...');
    
    const bot = new AdvancedSlackBot();
    
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
    console.error('💥 Error fatal iniciando Advanced SlackBot:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  main();
}

export { AdvancedSlackBot };
