#!/usr/bin/env node

/**
 * Demo de integración completa Slack Bot + PulseDesk
 * 
 * Este archivo demuestra cómo usar el bot avanzado con
 * todas las funcionalidades integradas.
 */

import { AdvancedSlackBot } from './bots/advanced-slack-bot.js';

async function demoSlackBot() {
  console.log('🎬 === DEMO: PulseDesk Slack Bot ===\n');

  try {
    // Crear instancia del bot
    console.log('1️⃣ Creando instancia del bot...');
    const bot = new AdvancedSlackBot();

    // Mostrar configuración
    console.log('2️⃣ Bot configurado con:');
    console.log('   - Socket Mode habilitado');
    console.log('   - Integración PulseDesk workflow');
    console.log('   - Manejo de mensajes directos');
    console.log('   - Manejo de menciones');
    console.log('   - Comandos slash /pulse');
    console.log('   - Botones interactivos');

    // Configurar manejo de señales
    console.log('\n3️⃣ Configurando shutdown elegante...');
    
    process.on('SIGINT', async () => {
      console.log('\n⏸️  Cerrando demo...');
      await bot.stop();
      console.log('✅ Demo terminado exitosamente');
      process.exit(0);
    });

    // Iniciar bot
    console.log('\n4️⃣ Iniciando bot de Slack...');
    await bot.start();

    // Mostrar instrucciones de uso
    console.log('\n🎉 ¡Bot iniciado exitosamente!');
    console.log('\n📱 === CÓMO PROBAR EL BOT ===');
    console.log('1. Envía un mensaje directo al bot:');
    console.log('   "Hola, ¿puedes ayudarme?"');
    console.log('\n2. Menciona el bot en un canal:');
    console.log('   "@pulsedesk necesito ayuda con un email"');
    console.log('\n3. Usa el comando slash (si está configurado):');
    console.log('   "/pulse enviar email urgente"');
    console.log('\n4. Interactúa con los botones que aparezcan');

    console.log('\n🔧 === EJEMPLOS DE MENSAJES PARA PROBAR ===');
    console.log('• "hola" → Saludo personalizado');
    console.log('• "ayuda" → Menú de comandos');
    console.log('• "email a juan@ejemplo.com" → Procesamiento de email');
    console.log('• "crear tarea urgente" → Gestión de tareas');
    console.log('• "¿cómo estás?" → Respuesta conversacional');

    console.log('\n⌨️  Presiona Ctrl+C para detener el bot');
    console.log('📊 Monitorea los logs para ver la actividad...\n');

  } catch (error) {
    console.error('❌ Error en el demo:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('SLACK_BOT_TOKEN')) {
        console.log('\n💡 SOLUCIÓN: Configura tus tokens de Slack en .env');
        console.log('   1. Copia .env.example a .env');
        console.log('   2. Visita https://api.slack.com/apps');
        console.log('   3. Configura tu app de Slack');
        console.log('   4. Copia los tokens a .env');
      }
      
      if (error.message.includes('Socket')) {
        console.log('\n💡 SOLUCIÓN: Habilita Socket Mode en tu Slack App');
        console.log('   1. Ve a Socket Mode en tu app config');
        console.log('   2. Activa "Enable Socket Mode"');
        console.log('   3. Genera App-Level Token con scope connections:write');
      }
    }
    
    process.exit(1);
  }
}

// Mostrar ayuda si se usa --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🤖 PulseDesk Slack Bot Demo\n');
  console.log('Uso:');
  console.log('  npm run demo:slack           # Ejecutar demo');
  console.log('  npm run demo:slack -- --help # Mostrar ayuda');
  console.log('\nAntes de ejecutar:');
  console.log('  1. Configura .env con tus tokens de Slack');
  console.log('  2. Asegúrate de tener una Slack App configurada');
  console.log('  3. Habilita Socket Mode en tu app');
  console.log('\nPara más información, lee: docs/slack-bot-guide.md');
  process.exit(0);
}

// Ejecutar demo
if (require.main === module) {
  demoSlackBot();
}