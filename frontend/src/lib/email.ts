import nodemailer from "nodemailer";

export async function sendEmailNotification(data: {
  eventName: string;
  fullName: string;
  phone: string;
  telegram: string;
  orderId: string;
  participants?: Array<{
    fullName: string;
    phone?: string;
    telegram?: string;
  }>;
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("[email] SMTP credentials not configured — admin notification skipped", {
      orderId: data.orderId,
      eventName: data.eventName,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: true, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const participantLines = (data.participants?.length ? data.participants : [{
    fullName: data.fullName,
    phone: data.phone,
    telegram: data.telegram,
  }]).map((participant, index) => [
    `Участник ${index + 1}:`,
    `Имя: ${participant.fullName}`,
    participant.phone ? `Телефон: ${participant.phone}` : null,
    participant.telegram ? `Telegram: ${participant.telegram}` : null,
  ].filter(Boolean).join("\n")).join("\n\n");

  const mailOptions = {
    from: `"РРК Уведомления" <${SMTP_USER}>`,
    to: "hello.rrc@proton.me",
    subject: `Новая оплата: ${data.eventName}`,
    text: `
🎉 Новая запись!

Событие: ${data.eventName}

${participantLines}

Плательщик:
Имя: ${data.fullName}
Телефон: ${data.phone}
Telegram: ${data.telegram}

Номер заказа: ${data.orderId}
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("[email] Admin notification sent", {
      to: "hello.rrc@proton.me",
      orderId: data.orderId,
      eventName: data.eventName,
    });
  } catch (error) {
    console.error("[email] Failed to send admin notification", {
      orderId: data.orderId,
      eventName: data.eventName,
      error,
    });
  }
}
