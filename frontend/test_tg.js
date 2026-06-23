const message = `
🎉 <b>Новая запись!</b>

<b>Событие:</b> Тестовое событие
<b>Дата события:</b> 16.07.2026, 14:30
<b>Осталось мест:</b> 8

<b>Участник:</b>
Имя: Влас
Телефон: 12345
Telegram: @vlas

<b>Заказ:</b> 123
<b>Оплачено:</b> 16.07.2026, 14:30
`.trim();

fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: "-1003991978010",
    text: message,
    parse_mode: 'HTML',
  }),
}).then(r => r.text()).then(console.log).catch(console.error);
