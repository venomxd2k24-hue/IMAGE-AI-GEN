const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./logger');
const { generateImage } = require('./ai');
const { validatePrompt, checkCooldown } = require('./utils');
const fs = require('fs');

const bot = new Telegraf(config.TELEGRAM_TOKEN);

// Helper untuk cek admin
const isAdmin = (userId) => config.ADMIN_IDS.includes(userId);

// Simpan config ke file
const saveConfigStore = () => {
  fs.writeFileSync('config-store.json', JSON.stringify({
    models: config.CLOUDFLARE_MODELS,
    apiConfigs: config.CLOUDFLARE_API_CONFIGS,
  }, null, 2));
};

// Start command
bot.start((ctx) => {
  ctx.reply('Selamat datang! Gunakan /generate <prompt> untuk buat gambar AI. Contoh: /generate kucing lucu di taman.\nLihat perintah lain: /help');
});

// Help command
bot.command('help', (ctx) => {
  const isUserAdmin = isAdmin(ctx.from.id);
  let helpText = 'Daftar perintah:\n';
  helpText += '/generate <prompt> - Generate gambar dari prompt\n';
  helpText += '/myid - Lihat Telegram user ID Anda\n';
  if (isUserAdmin) {
    helpText += '\nPerintah Admin:\n';
    helpText += '/addmodel <model> - Tambah model AI baru\n';
    helpText += '/addapikey <accountId> <token> - Tambah API key baru\n';
    helpText += '/listmodels - Lihat semua model\n';
    helpText += '/listapikeys - Lihat semua API keys\n';
  }
  ctx.reply(helpText);
});

// My ID command
bot.command('myid', (ctx) => {
  ctx.reply(`Telegram User ID Anda: ${ctx.from.id}`);
});

// Generate command
bot.command('generate', async (ctx) => {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(' ').slice(1);
  let prompt = args.join(' ');
  let model = config.CLOUDFLARE_MODELS[0]; // Default model

  // Cek jika ada model spesifik (contoh: /generate model:kucing_lucu prompt:kucing di taman)
  if (args[0].startsWith('model:')) {
    model = args[0].replace('model:', '');
    if (!config.CLOUDFLARE_MODELS.includes(model)) {
      return ctx.reply(`Model '${model}' tidak ditemukan. Gunakan /listmodels untuk lihat model tersedia.`);
    }
    prompt = args.slice(1).join(' ');
  }

  const cooldownError = checkCooldown(userId);
  if (cooldownError) {
    return ctx.reply(cooldownError);
  }

  const validationError = validatePrompt(prompt);
  if (validationError) {
    return ctx.reply(validationError);
  }

  try {
    ctx.reply(`Sedang generate gambar dengan model ${model}... Tunggu sebentar.`);
    const imageBuffer = await generateImage(prompt, model);
    await ctx.replyWithPhoto({ source: imageBuffer }, { caption: `Gambar dari prompt: "${prompt}" (model: ${model})` });
    logger.info(`Image generated for user ${userId} with prompt: ${prompt}, model: ${model}`);
  } catch (error) {
    ctx.reply('Maaf, ada error saat generate gambar. Coba lagi nanti.');
    logger.error(`Error in /generate for user ${userId}:`, error.message);
  }
});

// Admin commands
bot.command('addmodel', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('Perintah ini hanya untuk admin.');
  }
  const model = ctx.message.text.split(' ').slice(1).join(' ');
  if (!model || !model.startsWith('@cf/')) {
    return ctx.reply('Model harus diawali dengan "@cf/" dan valid. Contoh: @cf/stabilityai/stable-diffusion-xl-base-1.0');
  }
  if (config.CLOUDFLARE_MODELS.includes(model)) {
    return ctx.reply('Model sudah ada.');
  }
  config.CLOUDFLARE_MODELS.push(model);
  saveConfigStore();
  logger.info(`Admin ${ctx.from.id} added model: ${model}`);
  ctx.reply(`Model ${model} berhasil ditambahkan.`);
});

bot.command('addapikey', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('Perintah ini hanya untuk admin.');
  }
  const [accountId, token] = ctx.message.text.split(' ').slice(1);
  if (!accountId || !token) {
    return ctx.reply('Format: /addapikey <accountId> <token>');
  }
  if (config.CLOUDFLARE_API_CONFIGS.some(config => config.accountId === accountId)) {
    return ctx.reply('Account ID sudah ada.');
  }
  config.CLOUDFLARE_API_CONFIGS.push({ accountId, token });
  saveConfigStore();
  logger.info(`Admin ${ctx.from.id} added API key for account: ${accountId}`);
  ctx.reply(`API key untuk account ${accountId} berhasil ditambahkan.`);
});

bot.command('listmodels', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('Perintah ini hanya untuk admin.');
  }
  const models = config.CLOUDFLARE_MODELS.join('\n');
  ctx.reply(`Daftar model:\n${models || 'Tidak ada model.'}`);
});

bot.command('listapikeys', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('Perintah ini hanya untuk admin.');
  }
  const keys = config.CLOUDFLARE_API_CONFIGS.map(config => config.accountId).join('\n');
  ctx.reply(`Daftar account ID:\n${keys || 'Tidak ada API keys.'}`);
});

// Handle error global
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('Terjadi kesalahan internal. Silakan coba lagi.');
});

module.exports = bot;