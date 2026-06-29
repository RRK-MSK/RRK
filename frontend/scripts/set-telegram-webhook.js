/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = 'https://rrclub.site/api/telegram/webhook';

if (!token) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN не найден в .env.local');
  process.exit(1);
}

async function setWebhook() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✅ Webhook успешно установлен на:', webhookUrl);
      console.log('Теперь бот будет отвечать на /start');
    } else {
      console.error('❌ Ошибка установки webhook:', data);
    }
  } catch (error) {
    console.error('❌ Сетевая ошибка:', error);
  }
}

setWebhook();
