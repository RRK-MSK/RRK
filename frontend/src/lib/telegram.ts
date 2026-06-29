export async function sendTelegramNotification(data: {
  eventName: string;
  spotsLeft: number;
  name: string;
  phone: string;
  telegram: string;
  orderNumber: string;
  eventDate?: string;
  paymentDate?: string;
  source?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = "-1003991978010";

  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set. Cannot send notification.");
    return;
  }

  const escapeHtml = (text: string) => {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const safeEventName = escapeHtml(data.eventName || 'Не указано');
  const safeName = escapeHtml(data.name || 'Не указано');
  const safePhone = escapeHtml(data.phone || 'Не указан');
  const safeTg = escapeHtml(data.telegram || 'Не указан');
  const isMiniApp = data.source?.includes("Mini App");

  const message = `
🎉 <b>Новая запись!${isMiniApp ? ' (из МИНИ АПП 📱)' : ''}</b>

<b>Событие:</b> ${safeEventName}
${data.eventDate ? `<b>Дата события:</b> ${data.eventDate}\n` : ''}<b>Осталось мест:</b> ${data.spotsLeft}

<b>Участник:</b>
Имя: ${safeName}
Телефон: ${safePhone}
Telegram: ${safeTg}

<b>Заказ:</b> ${data.orderNumber}
${data.paymentDate ? `<b>Оплачено:</b> ${data.paymentDate}` : ((data.eventName || '').toLowerCase().includes('coffee jam') ? '<b>Оплата:</b> БЕСПЛАТНО' : '')}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Failed to send telegram message:", errorData);
    } else {
      console.log("Telegram notification sent successfully.");
    }
  } catch (error) {
    console.error("Error sending telegram notification:", error);
  }
}
