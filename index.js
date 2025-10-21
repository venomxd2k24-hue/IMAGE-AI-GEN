const bot = require('./bot');
const logger = require('./logger');

async function start() {
  try {
    await bot.launch();
    logger.info('Bot Telegram AI Image Generator started successfully.');
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

start();

// Handle graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));