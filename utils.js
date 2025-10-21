const config = require('./config');
const logger = require('./logger');

const userCooldowns = new Map(); // Map untuk track cooldown per user

function validatePrompt(prompt) {
  if (!prompt || prompt.length < 5) {
    return 'Prompt terlalu pendek. Minimal 5 karakter.';
  }
  if (prompt.length > config.MAX_PROMPT_LENGTH) {
    return `Prompt terlalu panjang. Maksimal ${config.MAX_PROMPT_LENGTH} karakter.`;
  }
  return null; // Valid
}

function checkCooldown(userId) {
  const now = Date.now();
  const lastRequest = userCooldowns.get(userId);
  if (lastRequest && now - lastRequest < config.COOLDOWN_TIME) {
    const remaining = Math.ceil((config.COOLDOWN_TIME - (now - lastRequest)) / 1000);
    return `Tunggu ${remaining} detik sebelum generate lagi.`;
  }
  userCooldowns.set(userId, now);
  return null;
}

module.exports = { validatePrompt, checkCooldown };