const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

let currentIndex = 0; // Track index untuk rotasi

async function generateImage(prompt, model = config.CLOUDFLARE_MODELS[0]) {
  const apiConfigs = config.CLOUDFLARE_API_CONFIGS;
  const maxRetries = apiConfigs.length;
  let retries = 0;

  while (retries < maxRetries) {
    const apiConfig = apiConfigs[currentIndex];
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${apiConfig.accountId}/ai/run/${model}`;
      const response = await axios.post(url, {
        prompt: prompt,
      }, {
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      });

      if (response.status !== 200) {
        throw new Error(`Cloudflare API error: ${response.statusText}`);
      }

      currentIndex = (currentIndex + 1) % apiConfigs.length;
      logger.info(`Image generated using account ID: ${apiConfig.accountId}, model: ${model}`);
      return response.data;
    } catch (error) {
      logger.error(`Error with account ID ${apiConfig.accountId}, model ${model}: ${error.message}`);
      currentIndex = (currentIndex + 1) % apiConfigs.length;
      retries++;
    }
  }

  throw new Error('All API keys failed. Quota mungkin habis di semua akun.');
}

module.exports = { generateImage };