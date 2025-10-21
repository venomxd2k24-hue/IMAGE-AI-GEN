require('dotenv').config();
const fs = require('fs');

let apiConfigs;
let models = ['@cf/stabilityai/stable-diffusion-xl-base-1.0']; // Default model
let adminIds;

try {
  apiConfigs = JSON.parse(process.env.CLOUDFLARE_API_CONFIGS);
  if (!Array.isArray(apiConfigs) || apiConfigs.length === 0) {
    throw new Error('Invalid CLOUDFLARE_API_CONFIGS');
  }
  adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim(), 10));
  if (!adminIds.length) {
    throw new Error('No ADMIN_IDS specified');
  }
  // Load from config-store.json if exists
  if (fs.existsSync('config-store.json')) {
    const configStore = JSON.parse(fs.readFileSync('config-store.json', 'utf8'));
    models = configStore.models || models;
    apiConfigs = configStore.apiConfigs || apiConfigs;
  }
} catch (error) {
  console.error('Error initializing config:', error);
  process.exit(1);
}

module.exports = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  CLOUDFLARE_API_CONFIGS: apiConfigs,
  CLOUDFLARE_MODELS: models,
  COOLDOWN_TIME: parseInt(process.env.COOLDOWN_TIME, 10) || 30000,
  MAX_PROMPT_LENGTH: parseInt(process.env.MAX_PROMPT_LENGTH, 10) || 500,
  ADMIN_IDS: adminIds,
};