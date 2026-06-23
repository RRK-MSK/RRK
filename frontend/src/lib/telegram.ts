export async function sendTelegramNotification(data: {
  eventName: string;
  spotsLeft: number;
  name: string;
  phone: string;
  telegram: string;
  orderNumber: string;
  eventDate?: string;
  paymentDate?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = "-1003991978010";

  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set. Cannot send notification.");
    return;
  }

  const message = `
🎉 <b>Новая запись!</b>

<b>Событие:</b> ${data.eventName}
${data.eventDate ? `<b>Дата события:</b> ${data.eventDate}\n` : ''}<b>Осталось мест:</b> ${data.spotsLeft}

<b>Участник:</b>
Имя: ${data.name}
Телефон: ${data.phone || 'Не указан'}
Telegram: ${data.telegram || 'Не указан'}

<b>Заказ:</b> ${data.orderNumber}
${data.paymentDate ? `<b>Оплачено:</b> ${data.paymentDate}` : ''}
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
